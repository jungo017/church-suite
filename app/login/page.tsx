import { Card } from "@/lib/ui/card";
import { getTenant } from "@/lib/tenant/context";
import { LoginForm } from "./login-form";

// 교회는 호스트(테넌트)로 해석되므로 교회 서브도메인에서 로그인한다.
export default async function LoginPage() {
  const tenant = await getTenant();
  const churchName = tenant?.name ?? "교회 관리 SaaS";
  const caption = tenant
    ? "교회 관리자, 직원, 열람 사용자, 교인 계정이 로그인합니다."
    : "전체 관리자와 유지보수 계정이 로그인합니다.";
  const year = new Date().getFullYear();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <Card className="flex flex-col gap-6 p-8">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-medium text-primary">{churchName}</p>
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-xs text-muted-foreground">
            {caption}
          </p>
        </div>

        <LoginForm />

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <button type="button" className="hover:text-foreground">
            아이디찾기
          </button>
          <span>|</span>
          <button type="button" className="hover:text-foreground">
            비밀번호찾기
          </button>
        </div>
      </Card>

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        Copyright {year}. {churchName}. All rights reserved.
      </footer>
    </main>
  );
}
