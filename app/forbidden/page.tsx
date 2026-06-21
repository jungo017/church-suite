// 권한 부족 안내 페이지 (RBAC 가드의 redirect 대상). UI 다듬기는 0.8.
export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>
      <p className="text-sm text-muted-foreground">
        이 페이지를 볼 수 있는 역할이 없습니다. 관리자에게 문의하세요.
      </p>
      <a href="/dashboard" className="text-sm underline">
        대시보드로 돌아가기
      </a>
    </main>
  );
}
