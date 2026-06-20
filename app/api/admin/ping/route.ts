import { NextResponse } from "next/server";
import { checkRole, guardStatus } from "@/lib/rbac/guards";
import { ROLES } from "@/lib/rbac/roles";

// 관리자 전용 라우트(RBAC 가드 시연/검증). admin 역할만 200.
export async function GET() {
  const res = await checkRole(ROLES.ADMIN);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: guardStatus(res.error) });
  }
  return NextResponse.json({ ok: true, userId: res.user.sub, roles: res.user.roles });
}
