import "server-only";
import {
  registerModule,
  getModule,
  registerReadContract,
  getReadContract,
} from "@church/core";
import { assetsManifest } from "@/lib/assets/manifest";
import { getAssetCount } from "@/lib/assets/contract";

// 호스트 모듈 합성(스펙 §1 P-1) — 설치/등록된 모듈의 매니페스트 + 읽기 계약을
// 코어 레지스트리에 등록한다. 호스트는 이 합성 계층에서만 모듈을 import 하고,
// 기능 코드(대시보드 등)는 레지스트리를 통해 소비한다(직접 결합 금지, AGENTS §4.1-1).
//
// 멱등: 테스트/HMR/중복 호출 안전. 셸 전면 배선은 M2, 모듈 물리 추출은 코어 기반 추출 후.
export function ensureModulesRegistered(): void {
  if (!getModule("assets")) registerModule(assetsManifest);
  if (!getReadContract("assets", "count")) {
    registerReadContract("assets", "count", getAssetCount);
  }
}
