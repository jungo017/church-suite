import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { TENANT_HOST_HEADER } from "@/lib/tenant/host";
import { resolveTenant } from "@/lib/tenant/resolve";

/**
 * 진단용 엔드포인트 (개발 전용): 호스트 → 테넌트 해석 결과를 반환한다.
 * 0.4 의 호스트 매핑/미등록 거부를 빠르게 확인하기 위한 것이며 프로덕션에서는 404.
 *   curl -H "Host: <slug>.localhost" localhost:3000/api/_tenant
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") notFound();

  const h = await headers();
  const host = h.get(TENANT_HOST_HEADER) ?? h.get("host");
  const { hint, tenant } = await resolveTenant(host);

  // 서브도메인인데 등록된 교회가 없으면 미등록 → 404(거부/안내)
  if (hint.kind === "subdomain" && !tenant) {
    return NextResponse.json(
      { error: "unregistered_tenant", hint },
      { status: 404 },
    );
  }

  return NextResponse.json({ hint, tenant });
}
