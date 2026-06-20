import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { withSystem } from "@/lib/db/tenant";
import { church } from "@/lib/db/schema";
import { resolveChurchByCode } from "@/lib/tenant/resolve";
import { createUser } from "@/lib/auth/users";
import { seedDefaultRoles, assignRole } from "@/lib/rbac/seed";
import { ROLES, type RoleName } from "@/lib/rbac/roles";

/**
 * 개발 전용 시드: 교회 + 기본 역할 + 사용자(역할 부여). 프로덕션에서는 404.
 * 정식 온보딩은 Phase 0.8 에서 구현되며 이 라우트를 대체한다.
 *   curl -XPOST localhost:3000/api/auth/dev-seed \
 *     -H 'content-type: application/json' \
 *     -d '{"code":"cityhope","name":"City Hope","loginId":"admin","password":"pw123456","role":"admin"}'
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") notFound();

  let body: {
    code?: string;
    name?: string;
    loginId?: string;
    password?: string;
    role?: RoleName;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { code, name, loginId, password, role } = body;
  if (!code || !loginId || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const existing = await resolveChurchByCode(code);
  let churchId = existing?.churchId;
  if (!churchId) {
    churchId = randomUUID();
    await withSystem((tx) =>
      tx.insert(church).values({ churchId, code, name: name ?? code }),
    );
  }

  await seedDefaultRoles(churchId);

  const { userId } = await createUser({
    churchId,
    loginId,
    password,
    name: loginId,
  });
  await assignRole(churchId, userId, role ?? ROLES.ADMIN);

  return NextResponse.json({ churchId, userId, role: role ?? ROLES.ADMIN });
}
