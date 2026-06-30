import "server-only";
import { eq } from "drizzle-orm";
import { withSystem } from "@church/core/db/tenant";
import { church } from "@church/core/db/schema";
import { parseTenantHost, type TenantHint } from "./host";

/**
 * 호스트 → church 해석 (Node, DB). 교차 테넌트 조회이므로 withSystem(RLS 우회)으로 읽는다.
 */

export type ResolvedTenant = {
  churchId: string;
  code: string;
  name: string;
  status: string;
};

/** 교회 코드(서브도메인 slug)로 교회를 찾는다. */
export async function resolveChurchByCode(
  code: string,
): Promise<ResolvedTenant | null> {
  const rows = await withSystem((tx) =>
    tx
      .select({
        churchId: church.churchId,
        code: church.code,
        name: church.name,
        status: church.status,
      })
      .from(church)
      .where(eq(church.code, code))
      .limit(1),
  );
  return rows[0] ?? null;
}

/**
 * 호스트로 테넌트를 해석한다.
 *   - subdomain → church.code 매핑
 *   - custom    → Phase 4(SITE.domain)에서 구현. 현재는 미해석(null)
 *   - root/none → 테넌트 없음(null)
 */
export async function resolveTenant(
  rawHost: string | null | undefined,
): Promise<{ hint: TenantHint; tenant: ResolvedTenant | null }> {
  const hint = parseTenantHost(rawHost);
  if (hint.kind === "subdomain") {
    return { hint, tenant: await resolveChurchByCode(hint.slug) };
  }
  return { hint, tenant: null };
}
