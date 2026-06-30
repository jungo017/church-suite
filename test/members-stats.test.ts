import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@church/module-members/service";
import { saveAttendance } from "@church/module-members/attendance";
import { memberStats, attendanceTrend } from "@church/module-members/stats";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교적 통계", () => {
  it("교인 집계 + 출석 추이 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const m1 = await createMember(a, { name: "갑", status: "active", gender: "male" });
    await createMember(a, { name: "을", status: "active", gender: "female" });
    await createMember(a, { name: "병", status: "inactive", gender: "male" });

    const stats = await memberStats(a);
    expect(stats.total).toBe(3);
    expect(stats.byStatus.find((x) => x.key === "active")?.n).toBe(2);
    expect(stats.byStatus.find((x) => x.key === "inactive")?.n).toBe(1);
    expect(stats.byGender.find((x) => x.key === "male")?.n).toBe(2);

    // 다른 교회는 0
    expect((await memberStats(b)).total).toBe(0);

    // 출석 추이
    await saveAttendance(a, "2026-06-07", "sunday", [
      { memberId: m1.memberId, present: true },
    ]);
    const trend = await attendanceTrend(a);
    expect(trend).toHaveLength(1);
    expect(trend[0]!.present).toBe(1);
    expect(await attendanceTrend(b)).toHaveLength(0);
  });
});
