import { NextResponse } from "next/server";
import { onboardChurch, OnboardError } from "@/lib/onboarding/onboard";

/**
 * POST /api/onboard — 새 교회 가입(공개). 루트 도메인에서 호출(테넌트 불필요).
 * body: { churchName, churchCode, adminLoginId, adminPassword, adminName? }
 */
export async function POST(req: Request) {
  let body: {
    churchName?: string;
    churchCode?: string;
    adminLoginId?: string;
    adminPassword?: string;
    adminName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { churchName, churchCode, adminLoginId, adminPassword, adminName } = body;
  if (!churchName || !churchCode || !adminLoginId || !adminPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const result = await onboardChurch({
      churchName,
      churchCode,
      adminLoginId,
      adminPassword,
      adminName,
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    if (e instanceof OnboardError) {
      return NextResponse.json({ error: e.code }, { status: 400 });
    }
    throw e;
  }
}
