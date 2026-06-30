import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { subscription, plan } from "@/lib/db/schema";
import { modulesForPlan, DEFAULT_PLAN, type ModuleKey } from "@church/core";

/**
 * 엔타이틀먼트 해석 (스펙 §1 P-1, M3) — module-platform.md §7.
 *
 * 교회의 **활성 구독 → 플랜명 → 설치 모듈 집합**을 해석한다.
 * 플랜명→모듈 매핑(가격 정책)은 core(`modulesForPlan`)가 소유하고,
 * 여기서는 "이 교회가 어떤 플랜인지"만 DB에서 읽는다(관심사 분리).
 *
 * React `cache` 로 요청 단위 메모이즈 — 같은 요청에서 레이아웃(네비)과
 * 가드(라우트/쓰기)가 churchId 로 중복 호출해도 쿼리는 1회.
 */
export const getInstalledModules = cache(
  async (churchId: string): Promise<Set<ModuleKey>> => {
    const rows = await withTenant(churchId, (tx) =>
      tx
        .select({ planName: plan.name })
        .from(subscription)
        .innerJoin(plan, eq(subscription.planId, plan.planId))
        .where(
          and(
            eq(subscription.churchId, churchId),
            eq(subscription.status, "active"),
          ),
        )
        .limit(1),
    );
    // 활성 구독이 없으면 기본 플랜으로 폴백(온보딩 직후/데이터 이상 시 잠금 방지).
    const planName = rows[0]?.planName ?? DEFAULT_PLAN;
    return new Set(modulesForPlan(planName));
  },
);

/** 특정 모듈이 교회에 설치되어 있는지. */
export async function isModuleInstalled(
  churchId: string,
  key: ModuleKey,
): Promise<boolean> {
  return (await getInstalledModules(churchId)).has(key);
}
