import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { sendToActiveMembers, listNotifications } from "@/lib/notify/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("알림/문자 발송 (mock)", () => {
  it("연락처 보유 활성 교인에게만 발송 + 로그 + 격리", async () => {
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

    // 격리
    expect(await listNotifications(b)).toHaveLength(0);
  });
});
