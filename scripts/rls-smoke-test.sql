-- RLS 스모크 테스트 (Phase 0.3) — 빠른 수동 검증용.
-- 반드시 비슈퍼유저 롤(church_app)로 실행해야 의미가 있다(슈퍼유저는 RLS 우회).
--   npm run db:rls-test
-- 본격 자동화 격리 테스트(vitest)는 Phase 0.7 에서 추가된다.
--
-- 기대값:
--   [A] churches=1, members=1(A-member)
--   [A] 타교회 INSERT → RLS ERROR
--   [unset] churches=0, members=0  (세션변수 미설정 = 안전망)
--   [bypass] churches>=2
-- 테스트 데이터는 마지막에 정리한다.

\set ON_ERROR_STOP off
\pset pager off

-- ===== setup (system/bypass) =====
BEGIN;
  select set_config('app.bypass_rls','on',true);
  insert into church (church_id,name,code) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Church A','TEST_A');
  insert into church (church_id,name,code) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Church B','TEST_B');
  insert into member (member_id,church_id,name) values ('a1111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','A-member');
  insert into member (member_id,church_id,name) values ('b1111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','B-member');
COMMIT;

-- ===== tenant A scope =====
BEGIN;
  select set_config('app.church_id','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true);
  \echo '>>> [A] churches visible (expect 1):'
  select count(*) as churches_visible from church;
  \echo '>>> [A] members visible (expect 1, A-member):'
  select count(*) as members_visible, coalesce(string_agg(name,','),'') as names from member;
  \echo '>>> [A] cross-tenant INSERT into church B (expect RLS ERROR):'
  insert into member (church_id,name) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','hacked-into-B');
COMMIT;

-- ===== unset scope => safety net (0 rows) =====
\echo '>>> [unset] churches visible (expect 0):'
select count(*) as churches_visible from church;
\echo '>>> [unset] members visible (expect 0):'
select count(*) as members_visible from member;

-- ===== bypass => sees everything =====
BEGIN;
  select set_config('app.bypass_rls','on',true);
  \echo '>>> [bypass] churches visible (expect >=2):'
  select count(*) as churches_visible from church;
COMMIT;

-- ===== cleanup =====
BEGIN;
  select set_config('app.bypass_rls','on',true);
  delete from member where church_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  delete from church where code in ('TEST_A','TEST_B');
COMMIT;
\echo '>>> cleanup done'
