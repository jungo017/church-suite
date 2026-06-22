-- Custom SQL migration file, put your code below! --
-- PRE.0 — 교적 선행보강 테이블 테넌트 RLS.
-- 직분/직책 마스터 + 연도별 조직 편성. (module-survey-report.md §5.1)
SELECT apply_tenant_rls('position');
SELECT apply_tenant_rls('org_role');
SELECT apply_tenant_rls('org_membership');