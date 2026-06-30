-- Custom SQL migration file, put your code below! --
-- 소셜 로그인 신원/클레임 테이블 테넌트 RLS (스펙 §14, 소셜로그인→교인 매핑).
SELECT apply_tenant_rls('user_identity');
SELECT apply_tenant_rls('member_claim');