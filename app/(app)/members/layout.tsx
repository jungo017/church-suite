import { requireModule } from "@church/core/billing/guards";

// 교적 모듈 엔타이틀먼트 가드(M3) — 교회에 미설치면 이 경로군 전체가 404.
// (서버 액션은 레이아웃을 거치지 않으므로 쓰기는 actions 의 requireWrite 에서 별도 차단.)
export default async function MembersModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("members");
  return <>{children}</>;
}
