// @church/module-assets — 비품(자산) 모듈 (module-platform.md M4 파일럿).
// 호스트(셸/대시보드)가 소비하는 공개 표면만 노출한다:
//  - manifest: 셸이 네비/권한/소유스키마를 합성(레지스트리 등록).
//  - contract: 대시보드 등 타 영역이 직접 테이블 접근 없이 읽는 계약(자산 수).
// 모듈 내부 구현(service/actions/audit 등)은 서브패스(@church/module-assets/<file>)로 접근.
export { assetsManifest } from "./manifest";
export { getAssetCount } from "./contract";
