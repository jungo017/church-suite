import "server-only";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { notification, member } from "@/lib/db/schema";
import { getNotifyProvider, type NotifyResult } from "./provider";

/**
 * 문자/알림톡 발송 (스펙 §7.5, §14).
 * 흐름: 큐 적재(status=queued) → 워커/즉시 처리(채널 프로바이더 송출) → status=sent|failed.
 * 실제 채널은 lib/notify/provider 의 NOTIFY_DRIVER 로 교체(기본 log=mock).
 */

export const CHANNELS = ["sms", "alimtalk", "email"] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
  sms: "SMS",
  alimtalk: "알림톡",
  email: "이메일",
};
export function isChannel(v: string): v is Channel {
  return (CHANNELS as readonly string[]).includes(v);
}

function contactColumn(channel: Channel) {
  return channel === "email" ? member.email : member.phone;
}

// ───────────────────────── 큐 적재(queued) ─────────────────────────

/** 활성 교인(연락처 보유)에게 보낼 알림을 큐에 적재. 생성된 notificationId 반환. */
export async function queueToActiveMembers(
  churchId: string,
  opts: { channel: Channel; message: string },
): Promise<string[]> {
  return withTenant(churchId, async (tx) => {
    const contactCol = contactColumn(opts.channel);
    const recipients = await tx
      .select({ memberId: member.memberId, name: member.name, contact: contactCol })
      .from(member)
      .where(
        and(
          eq(member.churchId, churchId),
          eq(member.status, "active"),
          isNotNull(contactCol),
        ),
      );
    if (recipients.length === 0) return [];
    const inserted = await tx
      .insert(notification)
      .values(
        recipients.map((r) => ({
          churchId,
          memberId: r.memberId,
          recipient: r.contact,
          recipientName: r.name,
          channel: opts.channel,
          message: opts.message,
          status: "queued",
        })),
      )
      .returning({ id: notification.notificationId });
    return inserted.map((x) => x.id);
  });
}

/** 특정 교인들(연락처 보유)에게 보낼 알림을 큐에 적재. */
export async function queueToMembers(
  churchId: string,
  opts: { memberIds: string[]; channel: Channel; message: string },
): Promise<string[]> {
  const ids = [...new Set(opts.memberIds)].filter(Boolean);
  if (ids.length === 0) return [];
  return withTenant(churchId, async (tx) => {
    const contactCol = contactColumn(opts.channel);
    const recipients = await tx
      .select({ memberId: member.memberId, name: member.name, contact: contactCol })
      .from(member)
      .where(
        and(
          eq(member.churchId, churchId),
          inArray(member.memberId, ids),
          isNotNull(contactCol),
        ),
      );
    if (recipients.length === 0) return [];
    const inserted = await tx
      .insert(notification)
      .values(
        recipients.map((r) => ({
          churchId,
          memberId: r.memberId,
          recipient: r.contact,
          recipientName: r.name,
          channel: opts.channel,
          message: opts.message,
          status: "queued",
        })),
      )
      .returning({ id: notification.notificationId });
    return inserted.map((x) => x.id);
  });
}

// ──────────────── 송출 처리(채널 프로바이더 — 워커가 호출) ────────────────

/**
 * 큐(queued)의 알림을 채널 프로바이더로 실제 송출하고 상태를 갱신한다.
 * 워커(JOBS.NOTIFY_SEND)와 즉시발송 경로가 공유하는 송출 코어.
 * 실채널 송출은 외부 호출이므로, 대량 처리 시 배치/분할을 검토(§14).
 */
export async function processNotifications(
  churchId: string,
  notificationIds: string[],
): Promise<{ sent: number; failed: number }> {
  const ids = [...new Set(notificationIds)].filter(Boolean);
  if (ids.length === 0) return { sent: 0, failed: 0 };
  const provider = getNotifyProvider();

  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select()
      .from(notification)
      .where(
        and(
          eq(notification.churchId, churchId),
          inArray(notification.notificationId, ids),
          eq(notification.status, "queued"),
        ),
      );

    let sent = 0;
    let failed = 0;
    for (const n of rows) {
      let result: NotifyResult;
      try {
        result = await provider.send({
          channel: n.channel,
          to: n.recipient ?? "",
          message: n.message,
        });
      } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : "send_error" };
      }
      if (result.ok) {
        sent++;
        await tx
          .update(notification)
          .set({
            status: "sent",
            sentAt: new Date(),
            providerRef: result.providerRef ?? null,
            error: null,
          })
          .where(eq(notification.notificationId, n.notificationId));
      } else {
        failed++;
        await tx
          .update(notification)
          .set({ status: "failed", error: result.error ?? "send_failed" })
          .where(eq(notification.notificationId, n.notificationId));
      }
    }
    return { sent, failed };
  });
}

// ──────────────── 즉시발송(큐 적재 + 처리) — 소규모/동기 경로 ────────────────

/** 활성 교인에게 즉시 발송(큐 적재 후 바로 송출). 발송 수 반환. */
export async function sendToActiveMembers(
  churchId: string,
  opts: { channel: Channel; message: string },
): Promise<{ sent: number }> {
  const ids = await queueToActiveMembers(churchId, opts);
  if (ids.length === 0) return { sent: 0 };
  const { sent } = await processNotifications(churchId, ids);
  return { sent };
}

/** 특정 교인들에게 즉시 발송. 발송 수 반환. */
export async function sendToMembers(
  churchId: string,
  opts: { memberIds: string[]; channel: Channel; message: string },
): Promise<{ sent: number }> {
  const ids = await queueToMembers(churchId, opts);
  if (ids.length === 0) return { sent: 0 };
  const { sent } = await processNotifications(churchId, ids);
  return { sent };
}

export async function listNotifications(churchId: string, limit = 50) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(notification)
      .where(eq(notification.churchId, churchId))
      .orderBy(desc(notification.createdAt))
      .limit(limit),
  );
}
