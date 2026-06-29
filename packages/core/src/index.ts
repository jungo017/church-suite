// @church/core — 플랫폼 코어(스펙 §1 P-1, module-platform.md).
// M0b: 모듈 계약/레지스트리만 추출(앱 의존성 0). db/auth/rbac 등 기반 코드는 M4에서 점진 이전.
export * from "./module-contract";
export * from "./registry";
