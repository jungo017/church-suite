import "server-only";
import { and, count, eq } from "drizzle-orm";
import { getReadContract } from "@church/core";
import { withTenant } from "@church/core/db/tenant";
import { member } from "@church/core/db/schema";
import { ensureModulesRegistered } from "@/lib/modules.server";

// 대시보드 = **코어 합성 화면**(P-1 결정 #5). 모듈 데이터는 직접 테이블 접근이 아니라
// 모듈 읽기 계약으로 모은다(AGENTS §4.1-1). 자산 수는 비품 모듈 계약으로 디커플링(M1).
// (교인 수는 members 모듈 계약화 전까지 직접 조회 유지 — 추후.)

/** 대시보드 집계 (Phase 5.1). 테넌트 스코프. */
export async function dashboardCounts(churchId: string): Promise<{
  members: number;
  activeMembers: number;
  assets: number;
}> {
  ensureModulesRegistered();

  const { members, activeMembers } = await withTenant(churchId, async (tx) => {
    const m = await tx
      .select({ n: count() })
      .from(member)
      .where(eq(member.churchId, churchId));
    const active = await tx
      .select({ n: count() })
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.status, "active")));
    return {
      members: Number(m[0]?.n ?? 0),
      activeMembers: Number(active[0]?.n ?? 0),
    };
  });

  // 비품 모듈 읽기 계약 경유(미설치/미등록 시 0).
  const assetCount = getReadContract<number>("assets", "count");
  const assets = assetCount ? await assetCount(churchId) : 0;

  return { members, activeMembers, assets };
}
