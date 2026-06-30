import "server-only";

/**
 * 소셜 로그인 공급자 추상화 (스펙 §14) — 스토리지/알림 어댑터와 동일 패턴.
 *
 * 공급자(kakao/naver…)별 OAuth 흐름을 정규화 프로필로 추상화한다. 실제 드라이버는
 * 자격증명(env)이 있어야 동작하고, 자격증명 없는 개발/테스트는 `mock` 드라이버를 쓴다
 * (`OAUTH_DRIVER=mock` 기본). 매핑/세션 로직은 이 인터페이스에만 의존한다.
 */

/** 공급자에서 받아 정규화한 사용자 프로필. */
export type OAuthProfile = {
  provider: string;
  providerUserId: string; // 공급자 고유 식별자(sub)
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  phone: string | null;
};

export type OAuthProvider = {
  name: string;
  /** 동의 화면 URL. state(CSRF + 교회 컨텍스트)·redirectUri 포함. */
  getAuthorizeUrl(opts: { state: string; redirectUri: string }): string;
  /** 콜백 code → 정규화 프로필(토큰 교환 + 프로필 조회). */
  exchangeCode(opts: { code: string; redirectUri: string }): Promise<OAuthProfile>;
};

const SUPPORTED = new Set(["kakao", "naver"]);

/** 드라이버 선택(기본 mock). 실채널은 자격증명 확보 후 연결. */
function driver(): string {
  return process.env.OAUTH_DRIVER || "mock";
}

/**
 * mock 드라이버 — 자격증명 없이 흐름/매핑을 검증한다.
 * `code` 는 정규화 프로필의 JSON 문자열로 간주해 그대로 반환한다(테스트가 주입).
 */
function mockProvider(name: string): OAuthProvider {
  return {
    name,
    getAuthorizeUrl: ({ state, redirectUri }) =>
      `mock://oauth/${name}/authorize?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    exchangeCode: async ({ code }) => {
      let parsed: Partial<OAuthProfile> & { providerUserId?: string };
      try {
        parsed = JSON.parse(code);
      } catch {
        throw new Error("mock oauth: code 는 프로필 JSON 이어야 합니다.");
      }
      if (!parsed.providerUserId) {
        throw new Error("mock oauth: providerUserId 필수.");
      }
      return {
        provider: name,
        providerUserId: parsed.providerUserId,
        email: parsed.email ?? null,
        emailVerified: parsed.emailVerified ?? false,
        name: parsed.name ?? null,
        phone: parsed.phone ?? null,
      };
    },
  };
}

/** 실 공급자(kakao/naver) — 자격증명 연동 지점(미구현, 키 확보 후). */
function realProvider(name: string): OAuthProvider {
  throw new Error(
    `oauth: '${name}' 실드라이버 미구성 — OAUTH_DRIVER=mock 사용 또는 ${name.toUpperCase()}_CLIENT_ID/SECRET 설정 후 드라이버 구현 필요(스펙 §14).`,
  );
}

/** 공급자 핸들 조회. 미지원 공급자는 throw. */
export function getOAuthProvider(name: string): OAuthProvider {
  if (!SUPPORTED.has(name)) throw new Error(`oauth: 미지원 공급자 '${name}'.`);
  return driver() === "mock" ? mockProvider(name) : realProvider(name);
}
