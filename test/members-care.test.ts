import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { addCare, listMemberCare, deleteCare } from "@/lib/members/care";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("목양 기록", () => {
  it("추가/조회/삭제 + 교인 연동 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "성도1" });

    const { careId } = await addCare(a, {
      memberId,
      careType: "visitation",
      careDate: "2026-06-01",
      content: "가정 심방",
    });
    const list = await listMemberCare(a, memberId);
    expect(list).toHaveLength(1);
    expect(list[0]!.content).toBe("가정 심방");

    expect(await listMemberCare(b, memberId)).toHaveLength(0);

    await deleteCare(a, careId);
    expect(await listMemberCare(a, memberId)).toHaveLength(0);
  });
});
