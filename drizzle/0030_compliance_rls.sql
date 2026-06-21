-- Phase 6.3 — 컴플라이언스 테이블 테넌트 RLS.
SELECT apply_tenant_rls('access_log');
SELECT apply_tenant_rls('consent');
