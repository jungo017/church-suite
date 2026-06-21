-- Phase 1.6 — 전수조사 테이블 테넌트 RLS (apply_tenant_rls 재사용, 0009 정의).
SELECT apply_tenant_rls('asset_audit');
SELECT apply_tenant_rls('asset_audit_item');
