import { describe, it, expect, afterAll } from "vitest";
import { withTenant, withSystem } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { createChurch, deleteChurches, closeDb } from "./helpers";

// Phase 0 완료 게이트의 핵심: 행 단위 테넌트 격리(RLS).
const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("RLS 테넌트 격리", () => {
  it("읽기/쓰기가 현재 교회로 스코프된다", async () => {
    const a = await createChurch("A");
    const b = await createChurch("B");
    created.push(a, b);

    await withTenant(a, (tx) =>
      tx.insert(member).values({ churchId: a, name: "A-mem" }),
    );
    await withTenant(b, (tx) =>
      tx.insert(member).values({ churchId: b, name: "B-mem" }),
    );

    const aMembers = await withTenant(a, (tx) => tx.select().from(member));
    expect(aMembers).toHaveLength(1);
    expect(aMembers[0]!.name).toBe("A-mem");

    const bMembers = await withTenant(b, (tx) => tx.select().from(member));
    expect(bMembers).toHaveLength(1);
    expect(bMembers[0]!.name).toBe("B-mem");
  });

  it("타교회 church_id 로의 INSERT 는 WITH CHECK 로 차단된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await expect(
      withTenant(a, (tx) =>
        tx.insert(member).values({ churchId: b, name: "hack" }),
      ),
    ).rejects.toThrow();
  });

  it("테넌트 미설정 시 0행이 반환된다(안전망)", async () => {
    const a = await createChurch();
    created.push(a);
    await withTenant(a, (tx) =>
      tx.insert(member).values({ churchId: a, name: "x" }),
    );

    // 래퍼 없이 직접 db 접근 → app.church_id 미설정 → RLS 가 전부 숨김
    const rows = await db.select().from(member);
    expect(rows).toHaveLength(0);
  });

  it("withSystem 은 테넌트를 가로질러 조회한다(시스템 컨텍스트)", async () => {
    const all = await withSystem((tx) => tx.select().from(member));
    expect(all.length).toBeGreaterThanOrEqual(1);
  });
});
