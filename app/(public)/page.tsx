// 공개 랜딩 페이지 ("/"). Phase 4(홈페이지)에서 테넌트별 공개 사이트로 확장.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">교회 관리 SaaS</h1>
      <p className="text-base text-gray-600 dark:text-gray-400">
        멀티테넌트 교회 관리 플랫폼 — 비품 · 교적 · 재정 · 홈페이지.
      </p>
      <p className="text-sm text-gray-500">
        Phase 0 (코어) 스캐폴드 완료. 인증·테넌시·RBAC 구현 진행 중.
      </p>
      <a
        href="/dashboard"
        className="mt-2 inline-block w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        대시보드 (인증 영역) →
      </a>
    </main>
  );
}
