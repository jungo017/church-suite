-- Phase 1.1 — 자산 모듈 테이블 RLS.
--
-- 이후 모듈에서도 재사용하도록 테넌트 RLS 적용을 함수로 일반화한다.
-- (church_id 컬럼을 가진 테넌트 테이블에 ENABLE+FORCE + tenant_isolation 정책 부여)

CREATE OR REPLACE FUNCTION apply_tenant_rls(tbl text) RETURNS void AS $fn$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
  EXECUTE format(
    $pol$
    CREATE POLICY tenant_isolation ON %I
      USING (
        current_setting('app.bypass_rls', true) = 'on'
        OR church_id = NULLIF(current_setting('app.church_id', true), '')::uuid
      )
      WITH CHECK (
        current_setting('app.bypass_rls', true) = 'on'
        OR church_id = NULLIF(current_setting('app.church_id', true), '')::uuid
      )
    $pol$,
    tbl
  );
END;
$fn$ LANGUAGE plpgsql;

SELECT apply_tenant_rls('department');
SELECT apply_tenant_rls('location');
SELECT apply_tenant_rls('asset_category');
SELECT apply_tenant_rls('asset');
