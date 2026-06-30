// 엔타이틀먼트(교회별 모듈 설치) 테스트 (스펙 §1 P-1, M3) — module-platform.md §7.
// 두 축을 분리해 검증한다:
//   1) 가격 정책(plan→modules) = 순수 함수 modulesForPlan (DB 불필요)
//   2) 설치 해석(활성 구독→플랜→설치 집합) = getInstalledModules (DB 필요)
//   3) 해제(uninstall) 강제 = visibleModules 가 미설치 모듈/네비를 숨김(seam 끝단)
import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { withSystem, withTenant } from "@church/core/db/tenant";
import { plan, subscription } from "@church/core/db/schema";
import {
  modulesForPlan,
  MODULE_KEYS,
  DEFAULT_PLAN,
  visibleModules,
  type ModuleKey,
} from "@church/core";
import { onboardChurch } from "@/lib/onboarding/onboard";
import { getInstalledModules } from "@church/core/billing/entitlement";
import { PERMISSIONS, hasPermission, type Permission } from "@church/core/rbac/roles";
import { membersManifest } from "@/lib/members/manifest";
import { financeManifest } from "@/lib/finance/manifest";
import { createChurch, deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

const sorted = (s: Iterable<ModuleKey>) => [...s].sort();

/** 교회에 (커스텀)플랜 + 활성/비활성 구독을 직접 배선(테스트 픽스처). */
async function subscribe(
  churchId: string,
  planName: string,
  status = "active",
): Promise<void> {
  const planId = randomUUID();
  await withSystem((tx) =>
    tx.insert(plan).values({ planId, name: planName }).onConflictDoNothing(),
  );
  // unique 충돌 시 기존 planId 조회
  const row = await withSystem((tx) =>
    tx.select({ planId: plan.planId }).from(plan).where(eq(plan.name, planName)).limit(1),
  );
  await withTenant(churchId, (tx) =>
    tx.insert(subscription).values({ churchId, planId: row[0]!.planId, status }),
  );
}

describe("modulesForPlan — 가격 정책(플랜→모듈)", () => {
  it("free/standard/pro 는 (현재 결정) 전체 모듈", () => {
    for (const name of ["free", "standard", "pro"]) {
      expect(sorted(modulesForPlan(name))).toEqual([...MODULE_KEYS].sort());
    }
  });

  it("미지원 플랜명은 기본 플랜으로 폴백", () => {
    expect(sorted(modulesForPlan("nonexistent-xyz"))).toEqual(
      sorted(modulesForPlan(DEFAULT_PLAN)),
    );
  });

  it("호출마다 독립 Set 반환(공유 참조/가변 누설 없음)", () => {
    expect(modulesForPlan("free")).not.toBe(modulesForPlan("free"));
  });
});

describe("getInstalledModules — 활성 구독→플랜→설치 모듈", () => {
  it("온보딩한 교회는 free 플랜의 모듈이 설치된다", async () => {
    const { churchId } = await onboardChurch({
      churchName: "엔타이틀먼트 교회",
      churchCode: uniqueCode("ent"),
      adminLoginId: "churchadmin",
      adminPassword: "pw12345678",
    });
    created.push(churchId);
    expect(sorted(await getInstalledModules(churchId))).toEqual(
      sorted(modulesForPlan("free")),
    );
  });

  it("설치 집합은 교회의 활성 구독 플랜으로부터 해석된다(하드코딩 아님)", async () => {
    const churchId = await createChurch("커스텀 플랜 교회");
    created.push(churchId);
    const planName = uniqueCode("plan");
    await subscribe(churchId, planName, "active");
    // DB 해석 결과 == 그 교회 플랜명에 대한 가격 정책 결과
    expect(sorted(await getInstalledModules(churchId))).toEqual(
      sorted(modulesForPlan(planName)),
    );
  });

  it("활성 구독이 없으면 기본 플랜으로 폴백한다", async () => {
    const churchId = await createChurch("무구독 교회");
    created.push(churchId);
    expect(sorted(await getInstalledModules(churchId))).toEqual(
      sorted(modulesForPlan(DEFAULT_PLAN)),
    );
  });

  it("비활성(취소) 구독은 무시하고 기본 플랜으로 폴백한다", async () => {
    const churchId = await createChurch("취소 구독 교회");
    created.push(churchId);
    await subscribe(churchId, uniqueCode("plan"), "cancelled");
    expect(sorted(await getInstalledModules(churchId))).toEqual(
      sorted(modulesForPlan(DEFAULT_PLAN)),
    );
  });

  it("교회별로 독립 해석된다(타 교회 구독 누설 없음)", async () => {
    const a = await createChurch("교회A");
    const b = await createChurch("교회B");
    created.push(a, b);
    await subscribe(a, uniqueCode("plan"), "active");
    // b 는 구독이 없어도 a 의 설치가 누설되지 않고 자기 기준(폴백)으로 해석
    expect(sorted(await getInstalledModules(b))).toEqual(
      sorted(modulesForPlan(DEFAULT_PLAN)),
    );
  });
});

describe("해제(uninstall) 강제 — 미설치 모듈은 셸에서 숨겨진다", () => {
  const ALL = [membersManifest, financeManifest];
  const adminCan = (perm: string) =>
    hasPermission(["admin"], perm as Permission);

  it("설치 집합에 없는 모듈은 제외된다(finance 해제)", () => {
    const installed = new Set<ModuleKey>(["members"]); // finance 미설치
    const out = visibleModules(ALL, installed, adminCan);
    expect(out.map((m) => m.key)).toEqual(["members"]);
  });

  it("권한이 있어도 미설치면 보이지 않는다(RBAC ∩ 설치)", () => {
    // admin 은 finance:read 권한 보유하지만, 설치 집합이 비면 노출 0
    expect(hasPermission(["admin"], PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(visibleModules(ALL, new Set<ModuleKey>(), adminCan)).toEqual([]);
  });
});
