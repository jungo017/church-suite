import { describe, it, expect, afterAll } from "vitest";
import { logAccess, listAccessLogs } from "@church/core/compliance/access-log";
import { recordConsent, listConsents } from "@church/core/compliance/consent";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("PIPA 컴플라이언스", () => {
  it("접근로그 기록/조회 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await logAccess(a, { action: "member.view", targetType: "member", targetId: "m1" });
    const logs = await listAccessLogs(a);
    expect(logs).toHaveLength(1);
    expect(logs[0]!.action).toBe("member.view");
    expect(await listAccessLogs(b)).toHaveLength(0);
  });

  it("동의 기록/조회 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await recordConsent(a, { subjectName: "홍길동", consentType: "privacy", source: "newfamily" });
    const consents = await listConsents(a);
    expect(consents).toHaveLength(1);
    expect(consents[0]!.agreed).toBe(true);
    expect(consents[0]!.source).toBe("newfamily");
    expect(await listConsents(b)).toHaveLength(0);
  });
});
