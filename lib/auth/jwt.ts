import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { ACCESS_TTL_SEC } from "./config";

/**
 * 액세스 토큰(JWT, HS256) 발급/검증 (스펙 §9). claims = user_id/church_id/roles.
 * 비밀키는 import 시점이 아니라 호출 시점에 읽어 빌드 안전성을 확보한다.
 */
function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다.");
  return new TextEncoder().encode(s);
}

export type AccessClaims = {
  sub: string; // user_id
  church_id: string;
  roles: string[];
  name: string;
};

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({
    church_id: claims.church_id,
    roles: claims.roles,
    name: claims.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      church_id: String(payload.church_id ?? ""),
      roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
