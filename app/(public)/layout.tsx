// 공개 영역 레이아웃 (스펙 §13: app/(public)).
// SSG/ISR·SEO 대상. ⚠️ 민감 테이블 직접 접근 금지 — 발행 콘텐츠/접수 테이블만 (AGENTS.md §4).
// 교회별 색상 테마: site.theme 를 data-theme 로 적용(없으면 modern).
import { getTenant } from "@/lib/tenant/context";
import { getPublicSiteTheme } from "@/lib/site/public";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  const theme = tenant ? await getPublicSiteTheme(tenant.churchId) : "modern";
  return (
    <div className="flex-1 bg-background text-foreground" data-theme={theme}>
      {children}
    </div>
  );
}
