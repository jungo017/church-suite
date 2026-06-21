-- Phase 3.1 — 재정 테이블 테넌트 RLS.
SELECT apply_tenant_rls('account');
SELECT apply_tenant_rls('voucher');
