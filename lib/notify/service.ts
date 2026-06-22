import "server-only";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { notification, member } from "@/lib/db/schema";

/**
 * 문자/알림톡 발송 (스펙 §7.5). ⚠️ 실제 송출은 외부 채널 연동 추후(§14).
 * 여기서는 대상 교인에게 알림 로그를 'sent'(mock)로 생성한다.
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

/** 활성 교인(해당 채널 연락처 보유)에게 일괄 발송(mock). 발송 수 반환. */
export async function sendToActiveMembers(
  churchId: string,
  opts: { channel: Channel; message: string },
): Promise<{ sent: number }> {
  return withTenant(churchId, async (tx) => {
    const contactCol = opts.channel === "email" ? member.email : member.phone;
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
    if (recipients.length === 0) return { sent: 0 };

    const now = new Date();
    await tx.insert(notification).values(
      recipients.map((r) => ({
        churchId,
        memberId: r.memberId,
        recipient: r.contact,
        recipientName: r.name,
        channel: opts.channel,
        message: opts.message,
        status: "sent",
        sentAt: now,
      })),
    );
    return { sent: recipients.length };
  });
}

/** 특정 교인들(연락처 보유)에게 일괄 발송(mock). 발송 수 반환. */
export async function sendToMembers(
  churchId: string,
  opts: { memberIds: string[]; channel: Channel; message: string },
): Promise<{ sent: number }> {
  const ids = [...new Set(opts.memberIds)].filter(Boolean);
  if (ids.length === 0) return { sent: 0 };
  return withTenant(churchId, async (tx) => {
    const contactCol = opts.channel === "email" ? member.email : member.phone;
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
    if (recipients.length === 0) return { sent: 0 };

    const now = new Date();
    await tx.insert(notification).values(
      recipients.map((r) => ({
        churchId,
        memberId: r.memberId,
        recipient: r.contact,
        recipientName: r.name,
        channel: opts.channel,
        message: opts.message,
        status: "sent",
        sentAt: now,
      })),
    );
    return { sent: recipients.length };
  });
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
