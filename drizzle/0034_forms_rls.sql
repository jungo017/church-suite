-- Custom SQL migration file, put your code below! --
-- S.1 — 설문·보고 엔진 테이블 테넌트 RLS. (module-survey-report.md §3)
SELECT apply_tenant_rls('form');
SELECT apply_tenant_rls('form_field');
SELECT apply_tenant_rls('form_assignment');
SELECT apply_tenant_rls('form_response');
SELECT apply_tenant_rls('form_answer');