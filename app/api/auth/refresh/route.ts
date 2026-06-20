import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth/session";

// POST /api/auth/refresh — 리프레시 쿠키로 액세스 토큰 갱신(회전).
export async function POST() {
  const r = await refreshSession();
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 401 });
  return NextResponse.json({ ok: true });
}
