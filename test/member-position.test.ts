import { describe, it, expect, afterAll } from "vitest";
import { createMember, getMember } from "@/lib/members/service";
import { createPosition, positionLabelMap } from "@/lib/members/org";
import { memberStats } from "@/lib/members/stats";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교인 ↔ 직분 마스터 연동", () => {
  it("교인에 positionId 저장 + 라벨 맵 해석", async () => {
    const a = await createChurch();
    created.push(a);
    const { positionId } = await createPosition(a, { label: "집사" });
    const { memberId } = await createMember(a, { name: "김집사", positionId });

    const m = await getMember(a, memberId);
    expect(m!.positionId).toBe(positionId);

    const map = await positionLabelMap(a);
    expect(map[positionId]).toBe("집사");
  });

  it("통계 직분 집계: 코드 라벨 우선 + 레거시 텍스트 fallback", async () => {
    const a = await createChurch();
    created.push(a);
    const { positionId } = await createPosition(a, { label: "권사" });
    await createMember(a, { name: "코드직분", positionId });
    await createMember(a, { name: "레거시직분", position: "장로" }); // 텍스트만(positionId 없음)

    const stats = await memberStats(a);
    const keys = stats.byPosition.map((b) => b.key);
    expect(keys).toContain("권사"); // positionId → 마스터 라벨
    expect(keys).toContain("장로"); // 레거시 텍스트 fallback
  });
});
