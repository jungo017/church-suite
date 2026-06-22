import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { notification } from "@/lib/db/schema";
import { createMember } from "@/lib/members/service";
import {
  sendToActiveMembers,
  queueToActiveMembers,
  processNotifications,
  listNotifications,
} from "@/lib/notify/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("문자/알림 발송 (큐 → 프로바이더 송출)", () => {
  it("즉시발송: 활성+연락처만 + 프로바이더 송출 후 sent + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await createMember(a, { name: "유폰", status: "active", phone: "010-1111-2222" });
    await createMember(a, { name: "무폰", status: "active" }); // 전화 없음
    await createMember(a, { name: "비활동", status: "inactive", phone: "010-3333-4444" });

    const res = await sendToActiveMembers(a, { channel: "sms", message: "주일예배 안내" });
    expect(res.sent).toBe(1); // 활성 + 전화 보유만

    const logs = await listNotifications(a);
    expect(logs).toHaveLength(1);
    expect(logs[0]!.recipientName).toBe("유폰");
    expect(logs[0]!.status).toBe("sent");
    expect(logs[0]!.providerRef).toBeTruthy(); // 프로바이더 메시지 ID 기록

    expect(await listNotifications(b)).toHaveLength(0); // 격리
  });

  it("큐 적재(queued) → processNotifications 로 송출(sent)", async () => {
    const a = await createChurch();
    created.push(a);
    await createMember(a, { name: "대상", status: "active", phone: "010-5555" });

    const ids = await queueToActiveMembers(a, { channel: "alimtalk", message: "공지" });
    expect(ids).toHaveLength(1);
    expect((await listNotifications(a))[0]!.status).toBe("queued"); // 처리 전

    const r = await processNotifications(a, ids);
    expect(r).toMatchObject({ sent: 1, failed: 0 });
    expect((await listNotifications(a))[0]!.status).toBe("sent");
  });

  it("수신자 없는 알림은 failed + 사유 기록", async () => {
    const a = await createChurch();
    created.push(a);
    const [row] = await withTenant(a, (tx) =>
      tx
        .insert(notification)
        .values({ churchId: a, message: "x", channel: "sms", status: "queued" })
        .returning({ id: notification.notificationId }),
    );

    const r = await processNotifications(a, [row!.id]);
    expect(r).toMatchObject({ sent: 0, failed: 1 });

    const [n] = await withTenant(a, (tx) =>
      tx
        .select()
        .from(notification)
        .where(eq(notification.notificationId, row!.id)),
    );
    expect(n!.status).toBe("failed");
    expect(n!.error).toBe("no_recipient");
  });
});
