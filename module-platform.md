# module-platform.md — 모듈 플랫폼 아키텍처 제안서 (초안)

> **상태:** 제안서(draft). 방향 결정됨(**A안: 모듈러 모놀리식 + 모듈 계약**). 코드 미적용.
> **관계:** 도메인 기준은 [`church-saas-final-spec.md`](./church-saas-final-spec.md)(스펙). 이 문서는 스펙 §2-3·§13을 **확장**하는 *플랫폼/모듈화* 설계 제안이다. 확정 시 스펙 §1 결정 로그에 반영한다.
> **운영 지침:** [`AGENTS.md`](./AGENTS.md). 디자인은 [`DESIGN.md`](./DESIGN.md).

---

## 0. TL;DR

- **문제:** 대시보드·교적·재정·비품·홈페이지·설문/보고는 "메뉴 항목"이 아니라 각각 **독립 제품(모듈)** 단위다. 현재는 단일 Next 앱에 모두 박혀 있다(모놀리식).
- **목표:** 모듈을 **설치 가능한 수준(installable-grade)**으로 경계 짓되, **데이터는 공유 Postgres로 항상 통합**되게 한다.
- **결정:** **A안** — 단일 배포는 유지하고, ① **모듈 계약(Manifest)** ② **모듈별 패키지/스키마/마이그레이션 소유** ③ **교회별 설치(엔타이틀먼트)** 를 도입한다.
- **핵심 통찰:** 통합 접합면(seam = 공유 Postgres + `church_id`/RLS + `member_id` 단일 원본)을 고정하면, "한 앱 ↔ 모듈별 독립 배포(B안)"는 **비즈니스 로직 재작성 없이 포장만 바꾸는 일**이 된다. A안은 그 문을 열어둔 채 ops 비용 0에 가깝게 간다.

---

## 1. 배경 & 결정

### 1.1 현재 구조(as-is)
- 단일 Next.js 16 앱. 모듈 코드는 `lib/<module>` + `app/(app)/<module>`로 디렉터리 분리되어 있으나, **경계가 코드 규약 수준**이고 물리적 패키지·스키마·마이그레이션·네비게이션이 모두 **앱에 하드코딩**(`app/(app)/layout.tsx`의 `MODULES` 배열).
- 공유 코어는 `lib/{db,auth,tenant,rbac,storage,jobs,security,compliance,onboarding,notify,dashboard,utils,ui}`.

### 1.2 스펙이 이미 보장하는 것 (재활용)
| 근거 | 내용 |
|---|---|
| 스펙 §2-3 | "사이트는 분리, 코어는 공유. **교인 데이터 단일 원본**, 타 모듈은 `member_id` 참조만" |
| 스펙 §2-2 | 무상태 앱 서버(상태는 공용 DB/스토리지) |
| 스펙 §5 | 단일 Postgres + `church_id` + **RLS** |
| 구현됨 | `subscription`·`plan`·`church_storage_usage`(과금/구독), RBAC(역할·권한) |

→ **통합 seam과 엔타이틀먼트 토대가 이미 있다.** 빠진 건 "모듈을 1급 객체로 만드는 계약·레지스트리·소유 경계"뿐.

### 1.3 결정
- **채택: A안(모듈러 모놀리식 + 모듈 계약).**
- **B안(모듈별 독립 배포)** 은 *나중에 정당한 트리거가 생기면* 추출. A안은 추출이 포장 작업이 되도록 설계한다.
- **C안(서비스+DB 완전 분리)** 은 재정↔교적 조인 리포트를 ETL/API로 깨뜨리므로 **불채택**.

**확정된 세부 결정**(§13 참조):
1. 디렉터리 = **pnpm workspace**(`apps/web` 단일 배포 + `packages/{core,module-*}`).
2. DB = **모듈 Postgres 스키마**(`finance.*`·`assets.*` …) 네임스페이싱.
3. 파일럿 모듈 = **비품(assets)**.
4. 엔타이틀먼트 = **Set 기반(애드온-ready)으로 모델링, 출시는 번들(티어)로 단순화**(전환 시 가격 매핑만 변경).
5. 대시보드 = **코어 합성 화면**(독립 모듈 아님).

---

## 2. 목표 & 비목표

**목표**
1. 각 모듈이 **자기완결**(자기 화면·라우트·권한·스키마·마이그레이션·네비를 스스로 선언).
2. **교회별 설치/해제**(구독·엔타이틀먼트로 모듈 on/off).
3. 상단 탭 = **제품 스위처**(설치된 모듈만 노출).
4. **데이터 통합 불변**(공유 Postgres + `member_id`), 모듈 간 직접 결합 금지.
5. A→B 전환이 **재작성 없이** 가능하도록 seam 고정.

**비목표(이번 범위 아님)**
- 모듈별 독립 배포/스케일(B안), 모듈별 별도 DB(C안).
- 서드파티 모듈 마켓/플러그인 SDK 공개(추후).
- 런타임 동적 코드 로딩(모듈은 빌드타임 정적 등록으로 충분).

---

## 3. 핵심 추상화 — 모듈 계약 (Module Contract)

각 모듈은 자신을 **매니페스트**로 선언하고, 셸(호스트)은 **설치된 모듈만** 합성한다.

```ts
// packages/core/src/module-contract.ts (개념)
export type ModuleKey =
  | "members" | "finance" | "assets" | "site" | "forms";

export type ModuleManifest = {
  key: ModuleKey;
  title: string;                       // 제품 스위처 라벨 (예: "교적")
  // 네비게이션: 상단 제품 스위처 1개 + 사이드바(섹션 그룹 가능 — DESIGN.md §6 참조)
  nav: {
    section?: string;                  // 사이드바 섹션 헤더(평면 리스트 길이 완화)
    href: string;
    label: string;
    exact?: boolean;
    perm?: Permission;
  }[];
  permissions: Permission[];           // 이 모듈이 정의/요구하는 권한
  ownedSchema: string;                 // 모듈 소유 Postgres 스키마 (예: "finance")
  migrations: string;                  // 모듈 마이그레이션 디렉터리 경로
  requiresCore: string;                // 호환 코어 버전(semver range)
  // 다른 모듈/대시보드가 소비하는 읽기 계약(직접 테이블 접근 금지의 대안)
  readContracts?: Record<string, (churchId: string) => Promise<unknown>>;
};
```

**계약이 동시에 해결하는 것**
- 상단 탭/사이드바를 **데이터 기반**으로 생성(하드코딩 `MODULES` 제거).
- 교회별 설치 = 레지스트리에서 **엔타이틀먼트로 필터**.
- 권한·마이그레이션·스키마 **소유권 명시** → 경계 강제 근거.
- `readContracts` 로 **모듈 간 통합을 코어 경유**로만 허용(직접 import 금지).

---

## 4. 모듈 분류 (코어 vs 모듈)

| 구분 | 항목 | 소유 |
|---|---|---|
| **코어/플랫폼** | 테넌트·인증(JWT)·RBAC·스토리지·잡(pg-boss)·온보딩·과금/엔타이틀먼트·컴플라이언스(PIPA: access_log/consent)·알림 인프라(`lib/notify`)·**호스트 셸/대시보드 합성** | `packages/core` |
| **모듈: 교적(members)** | 교인·가족·출석·목양·교육·직분/직책·조직편성·키오스크·QR라벨·문자발송·셀프포털 | `packages/module-members` (스키마 `members`) |
| **모듈: 재정(finance)** | 계정과목·전표·보고서·기부금영수증·온라인헌금 반영 | `module-finance` (스키마 `finance`) |
| **모듈: 비품(assets)** | 자산·분류·수리이력·QR·전수조사 | `module-assets` (스키마 `assets`) |
| **모듈: 홈페이지(site)** | CMS(site/board/post/page)·공개사이트·접수(intake: 새가족/온라인헌금) | `module-site` (스키마 `site`) |
| **모듈: 설문/보고(forms)** | 폼빌더·응답·배정·집계·독려잡 | `module-forms` (스키마 `forms`) |

> **대시보드**는 독립 제품이 아니라 **호스트가 설치된 모듈의 `readContracts`를 합성**하는 화면으로 본다(교인 수·자산 수·올해 재정요약 등). → 모듈 미설치 시 해당 카드는 자동 비표시.
> **교인 마스터(`member`)·교회·사용자·권한**은 코어 소유(단일 원본). 모듈은 `member_id`로만 참조(스펙 §2-3).
> **컴플라이언스/알림**은 횡단 관심사 → 코어. 단 사용 트리거는 모듈(예: 교적이 알림 큐잉).

---

## 5. 데이터 소유 & 통합 모델

### 5.1 스키마 소유
- **코어 소유(공유):** `church`, `app_user`, `role`, `user_role`, `member`, `family`, `department`, `position`, `org_role`, `org_membership`, 과금(`plan`/`subscription`/`church_storage_usage`), 컴플라이언스(`access_log`/`consent`), 알림(`notification`).
- **모듈 소유:** 각 모듈 테이블을 **모듈 Postgres 스키마**(`finance.voucher`, `assets.asset` …)로 네임스페이스. 모두 `church_id` + RLS 유지(스펙 §5 불변).

### 5.2 통합 규칙 (불변)
1. 모듈 테이블은 **코어 `member`/`department` 등을 `member_id`/FK로 참조**만(스펙 §2-3).
2. **모듈 간 직접 결합 금지** — A 모듈이 B 모듈 테이블/쿼리코드를 import하지 않는다.
3. 모듈 간/대시보드 통합이 필요하면 **코어가 노출하는 읽기 계약 또는 Postgres 뷰**를 경유.
4. 복잡 집계는 스펙 §4대로 raw SQL/뷰(단, 뷰는 소유 모듈이 정의).

### 5.3 인터럽션 포인트(현재와 달라지는 부분)
- 단일 `drizzle/` 폴더 → **모듈별 마이그레이션 디렉터리**로 분할(코어 마이그레이션이 선행).
- 일부 cross-module 직접참조가 있다면 `readContract`/뷰로 치환 필요(예: 대시보드가 finance/assets 테이블 직접 조회 → 계약 경유).

> **점진 허용:** 스키마 네임스페이싱(`finance.*`)은 목표값. 초기엔 `public` 내 접두어 유지(`finance_*`)로 시작하고 추후 스키마로 이전하는 것도 허용(마이그레이션 비용 분산).

---

## 6. 셸(호스트) & 네비게이션

- 호스트 앱(`apps/web`)이 **모듈 레지스트리**를 import → **설치된 모듈만** 합성.
- 상단 가로 탭 = **제품 스위처**(설치+권한 통과 모듈만). "메뉴"가 아니라 제품 전환 UI로 의미를 명확히(현재 `app-shell.tsx` 개선).
- 사이드바 = 현재 모듈 매니페스트의 `nav`(섹션 그룹 지원 → 교적 13개 평면 리스트 완화, DESIGN.md §6).
- 라우트도 매니페스트의 `routes` 기준으로 매핑(미설치 모듈 경로 = 404/안내).

---

## 7. 교회별 설치(엔타이틀먼트)

- **단일 진실:** 교회별 설치 상태는 **`installedModules: Set<ModuleKey>`** 하나로 추상화한다. 런타임·가드·네비는 이 Set만 본다.
- **Set의 출처(가격 정책 — 아키텍처와 분리):**
  - **출시(현재): 번들/티어.** `plan`이 포함 모듈 집합을 정의 → `subscription`이 설치 모듈을 결정. (예: 무료=교적 / 스탠다드=교적+재정+비품 / 프로=전체)
  - **확장(추후): 애드온.** 베이스 ∪ 구매 애드온. 동일 `Set`만 채우므로 **재설계 없이 가격 매핑만 변경**.
- **런타임:** 테넌트 해석 직후 컨텍스트에 `installedModules` 주입. 레지스트리 = `전체 모듈 ∩ installedModules ∩ RBAC 권한`.
- **해제 시:** 네비/라우트 숨김 + 쓰기 차단. **데이터는 보존**(PIPA 파기정책 별도, 스펙 §14). 재설치 시 복원.
- **온보딩:** 기본 플랜의 모듈만 설치된 상태로 교회 생성(현 `onboardChurch` 확장 지점).

> RBAC와 엔타이틀먼트는 **직교**: 권한=사용자가 할 수 있는 일, 설치=교회가 보유한 제품. 가드는 둘 다 통과해야 함.
> **설계 원칙:** 코드는 항상 `Set` 기반(애드온-ready)으로 작성하고, 번들↔애드온은 *가격 정책 레이어*에서만 결정한다.

---

## 8. 목표 디렉터리 구조 (workspace, 단일 배포)

```
package.json                 # pnpm workspace 루트
apps/
  web/                       # 호스트/셸 — 단일 Next.js 배포(= 모듈러 모놀리식)
    app/(app)/...            # 셸 레이아웃 + 레지스트리 합성
    app/(public)/...         # 공개 경계(site 모듈이 제공하는 공개 라우트 마운트)
packages/
  core/                      # db, auth, tenant, rbac, storage, jobs, onboarding,
                             # compliance, notify, billing/entitlement,
                             # module-contract, 코어 스키마 + 코어 마이그레이션
  module-members/            # 매니페스트 + lib + 화면 + members.* 스키마/마이그레이션
  module-finance/
  module-assets/
  module-site/
  module-forms/
```

- **단일 배포 유지**: 빌드 산출물은 `apps/web` 하나. 패키지는 *경계*용이지 별도 배포가 아니다.
- **B안 전환 시**: `packages/module-finance` → `apps/finance`로 승격 + nginx 경로 라우팅 + 루트도메인 공유 JWT. seam 동일하므로 로직 무변경.

> **대안(경량):** 풀 workspace가 부담이면 단일 앱 내 `src/modules/<key>/`(매니페스트 포함) + `src/core/` 구조로도 A안의 90%를 달성 가능. 핵심은 **계약·소유·레지스트리**이지 폴더 형태가 아니다.

---

## 9. 경계 강제 (boundary enforcement)

- **의존 규칙:** 모듈 → 코어(O), 모듈 → 모듈(X), 코어 → 모듈(X).
- **자동화:** `dependency-cruiser`(또는 ESLint `no-restricted-imports`)로 cross-module import 차단을 CI에 추가.
- **DB:** 모듈은 자기 스키마 + 코어 공유 테이블만. 타 모듈 스키마 접근 금지(권한/리뷰로 강제).
- **계약 변경:** `ModuleManifest`/`readContracts` 변경은 코어 버전(semver) 변경 → `requiresCore`로 호환 검증.

---

## 10. 마이그레이션 경로 (빅뱅 아님 · 각 단계 독립 PR)

| 단계 | 내용 | 게이트 |
|---|---|---|
| **M0a** ✅ | 모듈 계약·레지스트리·파일럿(assets) 매니페스트 + 단위테스트 (순수 추가, 동작 불변). 위치 `lib/core/`(추출 시드) | typecheck·lint·109 tests green |
| **M0b** ✅(로컬) | pnpm workspace 전환(`packageManager` 고정, `allowBuilds`) + 물리적 `packages/core`(`@church/core`) 추출 + tsconfig/vitest 별칭 + CI·Dockerfile·compose·문서 pnpm화. core 는 의존성 0(권한검사 DI). lib 기반(db/auth/rbac) 이전은 M4. | 로컬 typecheck·lint·test(109)·build green. **CI/Docker는 푸시 시 실검증** |
| **M1** ✅(로컬) | 파일럿 **readContract 패턴**(비품/assets): 코어 읽기-계약 레지스트리(`read-contracts`) + `lib/assets/contract.ts`(`getAssetCount`) + 멱등 합성 부트스트랩(`lib/modules.server.ts`). **대시보드를 asset 테이블 직접 조회 → 모듈 계약 경유로 디커플링**(AGENTS §4.1-1). | 로컬 typecheck·lint·test(112)·build green |
| **M1.5(선행)** | **코어 기반 추출** — `db`/`auth`/`rbac`/`tenant`/`storage` → `@church/core`. *모듈 패키지 물리 추출의 선행조건*(모듈→앱 역참조 금지). M0b에서 분리해 둔 작업. | 빌드·테스트 green |
| **M2** | **레지스트리 기반 셸** — 하드코딩 `MODULES` 제거, 제품 스위처/사이드바를 매니페스트로 | E2E 네비/권한 |
| **M3** ✅ | **엔타이틀먼트 배선** — ① core 가격정책 `modulesForPlan`(plan→`Set<ModuleKey>`, 순수·애드온-ready. **현재 결정: 전 티어=전체 모듈**[현행 유지]) ② `lib/billing/entitlement`(활성 구독→플랜→설치집합 해석, React `cache` 요청 메모이즈, 미구독/비활성 폴백) ③ 셸 네비·대시보드 카드를 **설치 ∩ 권한**으로 필터(하드코딩 `installed=전체` 제거) ④ 가드: 모듈별 `(app)/<m>/layout.tsx` 라우트 가드(미설치=404) + 액션 `requireWrite` 쓰기 가드(미설치=forbidden, 레이아웃 우회 차단). 온보딩은 기존 free 구독으로 충족. | typecheck·lint·build green, **122 tests**(+11: 정책·DB해석·폴백·교회격리·해제강제) |
| **M4** | **모듈 패키지 물리 추출** — assets(파일럿) 포함 전 모듈을 `packages/module-*` 로(M1.5 코어 기반 위에서). 모듈→코어만 의존. | 모듈별 격리 테스트 |
| **M5** | (선택) `public` 접두어 → 모듈 Postgres 스키마 이전 | 마이그레이션 검증 |

각 단계는 **현재 기능·테스트를 깨지 않고** 머지 가능(스펙 §16 "다음 모듈이 코어를 올바르게 참조하는가" 검증 포인트 재사용).

---

## 11. 트레이드오프 & 리스크

| 항목 | 영향 | 완화 |
|---|---|---|
| 리팩터 범위(코어 추출·마이그레이션 분할) | 일회성 비용 | 단계별(M0~M5) 점진, 로직 무변경 |
| 대시보드/cross-module 직접참조 치환 | 일부 쿼리 재배선 | `readContracts`/뷰로 표준화 |
| 스키마 네임스페이싱 | 마이그레이션 작업 | 접두어→스키마 2단계 허용 |
| 엔타이틀먼트 복잡도 | 가드 이중화(RBAC+설치) | 컨텍스트에 `installedModules` 한 번 주입 |
| 과설계 위험(1인) | B안까지 안 갈 수도 | A안은 그 자체로 완결 — B는 옵션 |

---

## 12. 스펙 반영(확정 시 — 지금은 미적용)

- 스펙 §1 결정 로그 추가: *"(P-1) 모듈 플랫폼 = 모듈러 모놀리식 + 모듈 계약. 통합 seam(공유 Postgres+`member_id`) 고정, 모듈별 소유(스키마/마이그레이션/네비), 교회별 엔타이틀먼트. B안(독립 배포)은 추출 가능하도록 설계만."*
- 스펙 §2-3 확장(분리의 의미 = 화면+소유 경계), §13 구조에 workspace/모듈 패키지 반영.
- AGENTS.md §4 코딩 규칙에 "모듈→모듈 import 금지 / 통합은 코어 계약 경유" 추가.

---

## 13. 결정 사항(resolved)

| # | 질문 | 결정 |
|---|---|---|
| 1 | 디렉터리 | ✅ **pnpm workspace** (`apps/web` 단일 배포 + `packages/{core,module-*}`) |
| 2 | DB 스키마 | ✅ **모듈 Postgres 스키마** 네임스페이싱(`finance.*` 등). `public` 접두어는 M5 이전 단계의 *과도기 전술*로만 허용 |
| 3 | 파일럿 모듈 | ✅ **비품(assets)** |
| 4 | 엔타이틀먼트 | ✅ **Set 기반(애드온-ready) 모델링 + 번들(티어)로 출시.** 애드온은 가격 매핑만 바꿔 추후 확장 |
| 5 | 대시보드 | ✅ **코어 합성 화면**(독립 모듈 아님) |

> 남은 후속 결정(추후): ~~번들 티어 구성(무료/스탠다드/프로 모듈 매핑)~~ **결정됨(M3): 출시 전이므로 전 티어=전체 모듈**(현행 동작 유지). 티어 분리는 `packages/core/src/entitlement.ts` 의 `PLAN_MODULES` 맵만 바꾸면 됨(나머지 코드 무변경). · 애드온 전환 시점, `public`→스키마 이전(M5)의 정확한 시점.

---

## 14. 참고
- [`church-saas-final-spec.md`](./church-saas-final-spec.md) §2·§4·§5·§13·§16 — 아키텍처/데이터/멀티테넌시/구조/모듈 패턴.
- [`AGENTS.md`](./AGENTS.md) §4 — 불변 코딩 규칙(경계 분리·단일 원본).
- [`module-survey-report.md`](./module-survey-report.md) — 공유 모듈(설문) 설계 선례.
- [`DESIGN.md`](./DESIGN.md) §6 — 셸/네비(제품 스위처·사이드바 섹션 그룹).
