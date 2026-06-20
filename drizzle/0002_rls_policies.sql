-- Phase 0.3 — Row Level Security (스펙 §5, §17).
--
-- 모든 테넌트 테이블에 RLS 를 ENABLE + FORCE 한다(소유자/마이그레이션 롤도 정책 적용).
-- 정책: app.church_id 세션 변수와 일치하는 행만 접근. app.bypass_rls='on' 이면 우회
--       (시스템/온보딩/호스트→테넌트 해석 등 명시적 시스템 컨텍스트 전용).
--
-- 세션 변수 미설정 시:
--   current_setting('app.church_id', true) → NULL(또는 커스텀 GUC 기본값인 빈 문자열 '').
--   NULLIF(..., '')::uuid → NULL → church_id = NULL → 거짓 → 0행/INSERT 차단.
--   (빈 문자열을 NULLIF 로 거르지 않으면 ''::uuid 캐스트가 에러를 던지므로 반드시 감싼다.)
-- 따라서 스코프를 깜빡해도 데이터가 새지 않고 "아무것도 안 보임"이 기본값이다(안전망).
--
-- DDL 은 RLS 영향을 받지 않으므로 이 마이그레이션(소유자 실행)은 정상 적용된다.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['church', 'app_user', 'role', 'user_role', 'member', 'family'];
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
