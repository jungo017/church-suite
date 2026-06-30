import { requireModule } from "@church/core/billing/guards";

// 설문/보고 모듈 엔타이틀먼트 가드(M3) — 교회에 미설치면 이 경로군 전체가 404.
// (셀프 제출 /my/forms 는 본인 데이터 경계 — 여기서 가드하지 않는다.)
export default async function FormsModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("forms");
  return <>{children}</>;
}
