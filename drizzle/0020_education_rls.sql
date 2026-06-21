-- Phase 2.4 — 교육 테이블 테넌트 RLS.
SELECT apply_tenant_rls('education_program');
SELECT apply_tenant_rls('education_enrollment');
