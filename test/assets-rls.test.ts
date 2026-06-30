import { describe, it, expect, afterAll } from "vitest";
import { withTenant } from "@church/core/db/tenant";
import { asset } from "@church/core/db/schema";
import { createChurch, deleteChurches, closeDb } from "./helpers";

// Phase 1.1 — 자산 모듈도 코어와 동일하게 테넌트 격리(RLS)되는지 검증.
const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("자산 RLS 격리", () => {
  it("자산이 현재 교회로 스코프된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await withTenant(a, (tx) =>
      tx.insert(asset).values({ churchId: a, name: "A-책상" }),
    );
    await withTenant(b, (tx) =>
      tx.insert(asset).values({ churchId: b, name: "B-의자" }),
    );

    const aAssets = await withTenant(a, (tx) => tx.select().from(asset));
    expect(aAssets).toHaveLength(1);
    expect(aAssets[0]!.name).toBe("A-책상");
  });

  it("타교회 church_id 로의 자산 INSERT 는 차단된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await expect(
      withTenant(a, (tx) => tx.insert(asset).values({ churchId: b, name: "x" })),
    ).rejects.toThrow();
  });
});
