import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@church/module-members/service";
import {
  saveAttendance,
  listServiceAttendance,
  listMemberAttendance,
} from "@church/module-members/attendance";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("출석", () => {
  it("저장(upsert)/조회 + 멤버 이력 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "출석자" });

    await saveAttendance(a, "2026-06-07", "sunday", [
      { memberId, present: true },
    ]);
    let rows = await listServiceAttendance(a, "2026-06-07", "sunday");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.present).toBe(true);

    // 같은 키 재저장 → upsert(중복 생성 X, 값 갱신)
    await saveAttendance(a, "2026-06-07", "sunday", [
      { memberId, present: false },
    ]);
    rows = await listServiceAttendance(a, "2026-06-07", "sunday");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.present).toBe(false);

    expect(await listMemberAttendance(a, memberId)).toHaveLength(1);

    // 격리
    expect(await listServiceAttendance(b, "2026-06-07", "sunday")).toHaveLength(0);
  });
});
