-- Phase 0.8 — subscription / church_storage_usage 에 RLS 적용(테넌트 테이블).
-- plan 은 전역 참조 데이터(church_id 없음)이므로 RLS 미적용.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['subscription', 'church_storage_usage'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
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
      t
    );
  END LOOP;
END $$;
