import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { createPlatformUser } from "@church/core/platform/users";
import {
  isPlatformRole,
  PLATFORM_ROLES,
  type PlatformRole,
} from "@church/core/platform/roles";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") notFound();

  let body: {
    loginId?: string;
    password?: string;
    name?: string;
    role?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const loginId = body.loginId?.trim() || "sadmin";
  const password = body.password;
  const role: PlatformRole =
    body.role && isPlatformRole(body.role) ? body.role : PLATFORM_ROLES.SADMIN;

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  const created = await createPlatformUser({
    loginId,
    password,
    name: body.name?.trim() || loginId,
    role,
  });
  return NextResponse.json({ ok: true, ...created, role });
}
