import "server-only";
import { count, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { asset } from "@/lib/db/schema";

// 비품(자산) 모듈의 **읽기 계약** (스펙 §1 P-1, AGENTS §4.1-1).
// 다른 모듈/대시보드(호스트)가 asset 테이블을 직접 조회하지 않고 이 함수로 소비한다.
// (M1: 모듈 데이터 노출 API. 모듈 물리 추출은 코어 기반[db/rbac] 추출 이후.)

/** 교회의 자산 건수(테넌트 스코프). */
export async function getAssetCount(churchId: string): Promise<number> {
  return withTenant(churchId, async (tx) => {
    const r = await tx
      .select({ n: count() })
      .from(asset)
      .where(eq(asset.churchId, churchId));
    return Number(r[0]?.n ?? 0);
  });
}
