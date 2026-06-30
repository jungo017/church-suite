import { NextResponse } from "next/server";
import { getCurrentUser } from "@church/core/auth/session";

// GET /api/auth/me — 보호 라우트 예시. 액세스 토큰 검증.
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({
    user: { userId: u.sub, churchId: u.church_id, name: u.name, roles: u.roles },
  });
}
