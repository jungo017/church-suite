/**
 * 호스트 → 테넌트 힌트 파싱 (스펙 §5).
 *
 * ⚠️ Edge-safe: DB / Node / server-only 의존이 없는 순수 함수만 둔다.
 *    proxy.ts(Edge)와 서버(Node) 양쪽에서 import 한다.
 *    실제 church_id 해석(DB 조회)은 lib/tenant/resolve.ts(Node)에서 한다.
 */

export type TenantHint =
  | { kind: "subdomain"; slug: string; host: string }
  | { kind: "custom"; host: string }
  | { kind: "root"; host: string }
  | { kind: "none"; host: string };

/** 프록시가 다운스트림으로 전파하는 요청 헤더 이름. */
export const TENANT_HOST_HEADER = "x-tenant-host";
export const TENANT_SLUG_HEADER = "x-tenant-slug";

/** 루트(SaaS) 도메인. 서브도메인 추출 기준. */
export const ROOT_DOMAIN = (
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost"
).toLowerCase();

/** 테넌트로 인정하지 않는 예약 서브도메인. */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin", "static"]);

/** 포트 제거 + 소문자화. */
export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return "";
  return rawHost.split(":")[0]!.trim().toLowerCase();
}

/**
 * 호스트를 테넌트 힌트로 파싱한다.
 *   - `<slug>.<root>`           → subdomain (slug = 교회 코드 후보)
 *   - `<root>` / `www.<root>`   → root (마케팅/랜딩, 테넌트 아님)
 *   - 그 외                      → custom (커스텀 도메인, Phase 4 에서 SITE.domain 으로 해석)
 */
export function parseTenantHost(
  rawHost: string | null | undefined,
  rootDomain: string = ROOT_DOMAIN,
): TenantHint {
  const host = normalizeHost(rawHost);
  if (!host) return { kind: "none", host: "" };

  const root = rootDomain.toLowerCase();

  if (host === root || host === `www.${root}`) {
    return { kind: "root", host };
  }

  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    // 단일 라벨 서브도메인만 테넌트로 인정(a.b.root 형태·예약어 제외)
    if (!slug || slug.includes(".") || RESERVED_SUBDOMAINS.has(slug)) {
      return { kind: "root", host };
    }
    return { kind: "subdomain", slug, host };
  }

  return { kind: "custom", host };
}
