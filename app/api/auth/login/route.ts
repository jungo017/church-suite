import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant/context";
import { login } from "@/lib/auth/session";

// POST /api/auth/login  body: { loginId, password }
// 교회(church_id)는 요청 호스트(테넌트)로부터 해석한다(0.4).
export async function POST(req: Request) {
  let body: { loginId?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { loginId, password } = body;
  if (!loginId || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const tenant = await getTenant();
  if (!tenant) {
    return NextResponse.json({ error: "tenant_required" }, { status: 400 });
  }

  const result = await login({ churchId: tenant.churchId, loginId, password });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    userId: result.userId,
    roles: result.roles,
  });
}
