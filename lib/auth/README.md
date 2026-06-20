# lib/auth

인증/세션/리프레시 토큰 (스펙 §9, AGENTS.md §4).

**Phase 0.5 에서 구현:** JWT(httpOnly, 짧은 만료) + DB 리프레시 토큰(취소 가능).
claims = `church_id` / `user_id` / `roles`. 로그아웃·정지·권한변경 시 리프레시 무효화.
**Phase 0.6:** RBAC 가드(ROLE/USER_ROLE).
