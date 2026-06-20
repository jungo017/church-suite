import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  parseTenantHost,
  normalizeHost,
  TENANT_HOST_HEADER,
  TENANT_SLUG_HEADER,
} from "@/lib/tenant/host";

/**
 * 테넌트 해석 프록시 (스펙 §5, §13). Next 16: `middleware`→`proxy`(스펙 §1).
 *
 * Edge 에서 동작하므로 호스트 "파싱"만 하고(순수 함수), DB 조회 없이 테넌트 힌트를
 * 요청 헤더로 다운스트림에 전파한다. 실제 church_id 해석(DB)·미등록 거부는
 * 서버 경계(lib/tenant: getTenant/requireTenant)에서 수행한다.
 * (인증 검사는 Phase 0.5 에서 추가)
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const hint = parseTenantHost(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_HOST_HEADER, normalizeHost(host));
  if (hint.kind === "subdomain") {
    requestHeaders.set(TENANT_SLUG_HEADER, hint.slug);
  } else {
    requestHeaders.delete(TENANT_SLUG_HEADER);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // 정적 자산·내부 경로 제외하고 모든 요청에 적용 (0.4 에서 세분화).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
