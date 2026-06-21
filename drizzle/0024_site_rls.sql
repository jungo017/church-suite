-- Phase 4.1 — CMS 테이블 테넌트 RLS.
SELECT apply_tenant_rls('site');
SELECT apply_tenant_rls('board');
SELECT apply_tenant_rls('post');
SELECT apply_tenant_rls('page');
