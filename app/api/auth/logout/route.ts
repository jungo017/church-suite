import { NextResponse } from "next/server";
import { logout } from "@church/core/auth/session";

// POST /api/auth/logout — 리프레시 토큰 취소 + 쿠키 삭제.
export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
