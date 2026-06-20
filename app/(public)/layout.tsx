// 공개 영역 레이아웃 (스펙 §13: app/(public)).
// SSG/ISR·SEO 대상. ⚠️ 민감 테이블 직접 접근 금지 — 발행 콘텐츠/접수 테이블만 (AGENTS.md §4).
// 홈페이지(Phase 4)에서 본격 구현.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1">{children}</div>;
}
