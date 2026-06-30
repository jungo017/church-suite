import "server-only";
import {
  registerModule,
  getModule,
  registerReadContract,
  getReadContract,
  type ModuleManifest,
} from "@church/core";
import { membersManifest } from "@church/module-members/manifest";
import { financeManifest } from "@church/module-finance/manifest";
import { assetsManifest } from "@church/module-assets/manifest";
import { siteManifest } from "@church/module-site/manifest";
import { formsManifest } from "@church/module-forms/manifest";
import { getAssetCount } from "@church/module-assets/contract";

// 호스트 모듈 합성(스펙 §1 P-1) — 설치/등록된 모듈의 매니페스트 + 읽기 계약을
// 코어 레지스트리에 등록한다. 호스트는 이 합성 계층에서만 모듈을 import 하고,
// 기능 코드(셸·대시보드 등)는 레지스트리를 통해 소비한다(직접 결합 금지, AGENTS §4.1-1).
//
// 멱등: 테스트/HMR/중복 호출 안전. 모듈 물리 추출은 코어 기반 추출(M1.5) 후.

// 등록 순서 = 셸 제품 스위처 노출 순서.
const MANIFESTS: ModuleManifest[] = [
  membersManifest,
  financeManifest,
  assetsManifest,
  siteManifest,
  formsManifest,
];

export function ensureModulesRegistered(): void {
  for (const m of MANIFESTS) {
    if (!getModule(m.key)) registerModule(m);
  }
  // 모듈 읽기 계약(호스트/타 모듈이 직접 테이블 접근 없이 소비).
  if (!getReadContract("assets", "count")) {
    registerReadContract("assets", "count", getAssetCount);
  }
}
