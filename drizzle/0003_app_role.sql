-- Phase 0.3 — 앱 런타임 전용 롤 (스펙 §5, §17).
--
-- ⚠️ RLS 는 슈퍼유저/BYPASSRLS 롤에는 적용되지 않는다(FORCE 도 무효).
-- 따라서 마이그레이션/관리는 슈퍼유저(church)로, 앱 런타임은 RLS 적용 대상인
-- 비슈퍼유저 롤(church_app)로 분리한다. 앱은 APP_DATABASE_URL 로 church_app 에 접속한다.
--
-- 이 마이그레이션은 슈퍼유저(DATABASE_URL=church)로 실행된다.
-- 비밀번호는 로컬 개발 기본값이며, 운영에서는 롤을 사전 프로비저닝하면 CREATE 는 건너뛴다.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'church_app') THEN
    CREATE ROLE church_app LOGIN PASSWORD 'church_app' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

GRANT CONNECT ON DATABASE church_suite TO church_app;
GRANT USAGE ON SCHEMA public TO church_app;

-- 현재 존재하는 테넌트 테이블 CRUD 권한 (RLS 정책으로 행 단위 제한됨)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO church_app;

-- 이후(소유자 church 가) 생성하는 테이블에도 자동으로 같은 권한 부여
ALTER DEFAULT PRIVILEGES FOR ROLE church IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO church_app;
