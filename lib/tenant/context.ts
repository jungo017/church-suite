import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TENANT_HOST_HEADER } from "./host";
import { resolveTenant, type ResolvedTenant } from "./resolve";

/**
 * 서버(서버 컴포넌트/라우트 핸들러)에서 현재 요청의 테넌트를 얻는다.
 * 프록시가 전파한 x-tenant-host 헤더(없으면 host)를 기준으로 해석한다.
 */
async function hostFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get(TENANT_HOST_HEADER) ?? h.get("host");
}

/** 현재 테넌트(없으면 null). */
export async function getTenant(): Promise<ResolvedTenant | null> {
  const { tenant } = await resolveTenant(await hostFromHeaders());
  return tenant;
}

/** 테넌트가 필수인 화면/핸들러에서 미등록이면 404(거부/안내) (스펙 §5). */
export async function requireTenant(): Promise<ResolvedTenant> {
  const tenant = await getTenant();
  if (!tenant) notFound();
  return tenant;
}
