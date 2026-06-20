-- Phase 0.5 — refresh_token 테이블에 RLS 적용 (0002 와 동일한 tenant_isolation 정책).
-- (church_app 의 CRUD 권한은 0003 의 ALTER DEFAULT PRIVILEGES 로 자동 부여됨.)

ALTER TABLE refresh_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON refresh_token;
CREATE POLICY tenant_isolation ON refresh_token
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR church_id = NULLIF(current_setting('app.church_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR church_id = NULLIF(current_setting('app.church_id', true), '')::uuid
  );
