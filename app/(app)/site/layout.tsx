import { requireModule } from "@/lib/billing/guards";

// 홈페이지(CMS) 모듈 엔타이틀먼트 가드(M3) — 교회에 미설치면 이 경로군 전체가 404.
// (공개 사이트 app/(public) 는 별도 경계 — 여기서 가드하지 않는다.)
export default async function SiteModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("site");
  return <>{children}</>;
}
