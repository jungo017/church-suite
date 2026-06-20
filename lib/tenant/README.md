# lib/tenant

테넌트 컨텍스트 유틸 (스펙 §5).

**Phase 0.4 에서 구현:** 호스트→church_id 해석, 요청별 테넌트 컨텍스트 전파.
**Phase 0.3 와 연동:** DB 커넥션마다 `set app.church_id` 세션 변수 설정(RLS).
