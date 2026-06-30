import { requireModule } from "@church/core/billing/guards";

// 재정 모듈 엔타이틀먼트 가드(M3) — 교회에 미설치면 이 경로군 전체가 404.
export default async function FinanceModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("finance");
  return <>{children}</>;
}
