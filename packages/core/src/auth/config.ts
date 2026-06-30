// 인증 설정 상수 (Edge-safe — server-only/Node 의존 없음).
// 쿠키 이름은 프록시(Edge) 등에서도 참조할 수 있으므로 여기 둔다.

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

/** 액세스 토큰 수명(초). 기본 15분 — 짧게(스펙 §9). */
export const ACCESS_TTL_SEC = Number(process.env.JWT_ACCESS_TTL_SEC ?? 900);

/** 리프레시 토큰 수명(초). 기본 30일. */
export const REFRESH_TTL_SEC = Number(
  process.env.JWT_REFRESH_TTL_SEC ?? 60 * 60 * 24 * 30,
);
