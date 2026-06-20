// 공개 랜딩 페이지 ("/"). 루트 도메인용 마케팅/가입 진입점.
// 테넌트별 공개 사이트(교회 홈페이지)는 Phase 4 에서 확장.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">교회 관리 SaaS</h1>
      <p className="text-base text-gray-600 dark:text-gray-400">
        멀티테넌트 교회 관리 플랫폼 — 비품 · 교적 · 재정 · 홈페이지.
      </p>
      <p className="text-sm text-gray-500">
        Phase 0 (코어) 완료: 멀티테넌시 · RLS · 인증 · RBAC · 온보딩.
      </p>
      <div className="mt-2 flex gap-3">
        <a
          href="/onboard"
          className="inline-block w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          교회 만들기 →
        </a>
        <span className="self-center text-sm text-gray-500">
          이미 교회가 있나요? 교회 주소(<code>코드.도메인</code>)에서 로그인하세요.
        </span>
      </div>
    </main>
  );
}
