import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { createAsset } from "@church/module-assets/service";
import { dashboardCounts } from "@/lib/dashboard";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("대시보드 집계", () => {
  it("교인/자산 카운트 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await createMember(a, { name: "재적1", status: "active" });
    await createMember(a, { name: "비활동1", status: "inactive" });
    await createAsset(a, { name: "의자" });

    const c = await dashboardCounts(a);
    expect(c.members).toBe(2);
    expect(c.activeMembers).toBe(1);
    expect(c.assets).toBe(1);

    const cb = await dashboardCounts(b);
    expect(cb.members).toBe(0);
    expect(cb.assets).toBe(0);
  });
});
