import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { withSystem } from "@/lib/db/tenant";
import { church } from "@/lib/db/schema";
import { resolveChurchByCode } from "@/lib/tenant/resolve";
import { createUser } from "@/lib/auth/users";

/**
 * 개발 전용 시드: 교회 + 사용자 생성(테스트용). 프로덕션에서는 404.
 * 정식 온보딩은 Phase 0.8 에서 구현되며 이 라우트를 대체한다.
 *   curl -XPOST localhost:3000/api/auth/dev-seed \
 *     -H 'content-type: application/json' \
 *     -d '{"code":"cityhope","name":"City Hope","loginId":"admin","password":"pw123456"}'
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") notFound();

  let body: {
    code?: string;
    name?: string;
    loginId?: string;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { code, name, loginId, password } = body;
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

  const { userId } = await createUser({
    churchId,
    loginId,
    password,
    name: loginId,
  });
  return NextResponse.json({ churchId, userId });
}
