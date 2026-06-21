# AGENTS.md — 작업 에이전트 운영 지침

> 이 파일은 **AI 코딩 에이전트(Claude Code 등)의 메인 운영 문서**입니다.
> 도메인·아키텍처의 **단일 기준 문서는 [`church-saas-final-spec.md`](./church-saas-final-spec.md)**(이하 "스펙").
> AGENTS.md는 스펙을 **어떻게 작업으로 옮길지**를 다룹니다. 결정/설계 세부는 항상 스펙을 우선합니다.

---

## 1. 프로젝트 한 줄 요약

여러 교회가 함께 쓰는 **멀티테넌트 교회 관리 SaaS**. 모듈: 비품(자산) · 교적 · 재정 · 홈페이지(CMS)+온라인교인센터.
1인 개발(솔로 친화 우선). 스택: **nginx + Next.js 16(App Router) + PostgreSQL + Drizzle**.

전체 배경·결정 근거·ERD는 스펙 §0~§17 참조.

---

## 2. 현재 상태 (작업을 시작하기 전 반드시 확인)

- **단계: Phase 5(고도화) 진행 중 — `P5.2 키오스크 출석` 완료. 다음: `P5.3 알림/문자`.** (작업 브랜치: `feat/phase-5-advanced`. Phase 0~4 main 병합 완료.)
- **Phase 5 구현됨(P5.2):** QR 키오스크 출석. `/members/kiosk`(탭 토글, 오늘 주일예배), `/members/kiosk/[memberId]`(QR 스캔 체크인), `/members/labels`(교인 QR=키오스크 딥링크). `kioskSetAction`(saveAttendance 재사용).
- **Phase 5 구현됨(P5.1):** 통합 대시보드. `lib/dashboard.ts`(교인/자산 카운트). `/dashboard` 교인·자산·올해 재정요약(finance:read)·최근 출석 카드. 테스트.
- **Phase 4 구현됨(P4.3):** 새가족 접수. `newfamily_req` intake(0025/0026). `lib/site/intake.ts`. 공개 `/online/new-family` 폼 → `/site/new-family` 어드민 승인(→교인 전환)/거절.
- **Phase 4 구현됨(P4.4):** 온라인 헌금 접수. `online_offering` intake. `lib/site/offering.ts`(제출=mock PG paid → 어드민 재정반영=수입 전표 생성, reflected). 공개 `/online/offering` 폼 → `/site/offerings` 어드민. 테스트(44 tests). **→ Phase 4 완료.** (실제 PG는 §14 추후)
- **Phase 4 구현됨(P4.2):** 공개 홈페이지. `lib/site/public.ts`(발행 콘텐츠만, `getPublicContext`). `app/(public)`: 홈(루트=마케팅 / 서브도메인=교회사이트 / 미발행=준비중), `/b/[slug]`·`/b/[slug]/[postId]`·`/p/[slug]`, `site-header`. 공개경계 테스트(미발행 숨김).
- **RBAC 추가(P4.1):** `site:read`/`site:write` 권한(admin·staff write, viewer read). 역할맵 갱신.
- **Phase 4 구현됨(P4.1):** CMS. `site`·`board`·`post`·`page` 스키마+RLS(0023/0024). `lib/site/admin.ts`+`actions.ts`. `/site`(개요·게시판/페이지 생성·공개여부)·`/site/boards/[id]`(글 등록·발행)·`/site/pages/[id]`(편집). site:write 가드. 테스트.
- **Phase 3 구현됨(P3.1):** 단식부기 모델. `account`(계정과목)·`voucher`(전표) 스키마+RLS(0021/0022), 금액 numeric. `lib/finance/`(constants·accounts). `/finance/accounts` 계정과목 관리(finance:read 보기, finance:write 추가). 테스트.
- **Phase 3 구현됨(P3.2):** 전표. `lib/finance/vouchers.ts`(조인 조회·필터(구분/계정/기간)·CRUD). `/finance` 전표 목록(필터·수입/지출/잔액 합계)·`/finance/new` 등록(계정·헌금자·금액·방법). numeric 정확도 테스트.
- **Phase 3 구현됨(P3.3):** 보고서. `lib/finance/report.ts`(raw SQL: 계정별 기간집계 accountSummary·월별 monthlyTotals, RLS 스코프 내). `/finance/report` 예결산(기간 수입/지출/잔액). 집계 테스트.
- **Phase 3 구현됨(P3.4):** 기부금영수증. `lib/finance/receipts.ts`(교인별 연간 헌금 합산 annualGivingByMember·memberAnnualGiving, raw SQL). `/finance/receipts`(연도별 목록)·`[memberId]`(출력용 영수증). 국세청 전자제출은 추후(§14). 테스트(40 tests). **→ Phase 3 완료.**
- **Phase 2 구현됨(P2.1):** member 확장(gender/email/address/registeredDate/departmentId=구역, 마이그레이션 0014). `lib/members/`(constants·service·actions). 화면 목록(검색·상태필터)·상세·등록·편집·가족관리. members:read/write 가드.
- **Phase 2 구현됨(P2.2):** 출석. `attendance` 스키마+RLS(0015/0016, 예배×날짜×교인 unique=upsert). `lib/members/attendance.ts`. `/members/attendance` 예배별 출석체크(일괄 저장). 테스트(33 tests).
- **Phase 2 구현됨(P2.3):** 목양 기록(심방/기도/상담). `pastoral_care` 스키마+RLS(0017/0018). `lib/members/care.ts`. 교인 상세에 목양 기록 + 최근 출석 표시. 테스트(34 tests).
- **Phase 2 구현됨(P2.4):** 교육 관리. `education_program`·`education_enrollment` 스키마+RLS(0019/0020). `lib/members/education.ts`+`education-actions.ts`. `/members/education`(과정 목록/생성)·`[programId]`(수강 등록·상태·제거). 테스트(35 tests).
- **Phase 2 구현됨(P2.5):** 통계. `lib/members/stats.ts`(상태/성별/직분 집계, 출석 추이 — RLS 스코프 내 집계). `/members/stats` 대시보드. 테스트(36 tests). **→ Phase 2 완료.**
- **Phase 1 구현됨(P1.1):** `department`(부서/구역, 공유 §6.4)·`location`·`asset_category`·`asset` 스키마 + church_id·인덱스·RLS(`apply_tenant_rls()` 함수로 일반화, 마이그레이션 0008/0009). asset: type(equipment/land/building/consumable)·status·tag(QR, 교회범위 unique)·`acquired_cost numeric`. 자산 RLS 격리 테스트.
- **Phase 1 구현됨(P1.2):** `lib/assets/`(`constants` 타입/라벨 / `service` 자산 CRUD·필터 / `classification` 부서·장소·품목 list/create / `actions` 서버액션, assets:write 가드). 서비스/분류 격리·필터 테스트(25 tests).
- **Phase 1 구현됨(P1.3):** `app/(app)/assets` 화면 — 목록(상태 필터·취득가액 포맷)·상세·등록(`/new`)·편집(`[id]/edit`)·분류 관리(`/classification`). 공용 `asset-form`. 읽기는 인증, 쓰기는 `assets:write`(미인증→/login, 권한부족→/forbidden). E2E 검증(렌더·권한).
- **Phase 1 구현됨(P1.4):** 수리이력. `asset_repair` 스키마+RLS(0010/0011). `lib/assets/repairs.ts`(list/add/delete). 액션(addRepair/deleteRepair, assets:write). 자산 상세에 이력 목록·추가·삭제 UI. 격리 테스트(26 tests).
- **Phase 1 구현됨(P1.5):** QR 라벨. `lib/assets/qr.ts`(`qrDataUrl`·`assetUrl`, qrcode 라이브러리). `/assets/labels` 인쇄용 라벨 그리드(자산 상세 딥링크 인코딩) + 인쇄 버튼. QR 테스트(28 tests).
- **Phase 1 구현됨(P1.6):** 전수조사. `asset_audit`·`asset_audit_item` 스키마+RLS(0012/0013). `lib/assets/audit.ts`(세션 생성+자산 스냅샷·항목/태그 체크·마감). 액션 + `/assets/audits`(목록/상세, 태그스캔·진행률·마감). 격리 테스트(29 tests). **→ Phase 1 완료.**
- **스택 확정:** Next.js **16.2.9**(App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · ESLint · **Drizzle ORM**(`postgres.js` 드라이버, casing=snake_case) · **PostgreSQL 16**(docker-compose).
- **DB 접속 2종(중요):** `DATABASE_URL`=슈퍼유저(`church`, 마이그레이션/drizzle-kit/시스템) · `APP_DATABASE_URL`=비슈퍼유저(`church_app`, 앱 런타임·RLS 적용). 앱은 반드시 후자로 접속(슈퍼유저는 RLS 우회).
- **구현됨(0.1):** §13 폴더 구조, 공개/인증 라우트 그룹(`app/(public)` · `app/(app)`), 테넌트 프록시 placeholder(`proxy.ts`), DB 클라이언트(`lib/db`), env/마이그레이션 파이프라인, `docker-compose.yml`(Postgres).
- **구현됨(0.2):** 코어 스키마(`church`·`app_user`·`role`·`user_role`·`member`·`family`) — 모든 테넌트 테이블 `church_id` FK(cascade) + 인덱스 + 교회범위 unique. 공통 타임스탬프 헬퍼.
- **구현됨(0.3):** 전 테넌트 테이블 RLS ENABLE+FORCE + `tenant_isolation` 정책(`app.church_id` 일치, `app.bypass_rls='on'` 우회). 앱 롤 `church_app`(마이그레이션 0003). 테넌트 래퍼 `lib/db/tenant.ts`(`withTenant`/`withSystem`, `SET LOCAL` via set_config). 검증: `npm run db:rls-test`.
- **구현됨(0.4):** `proxy.ts`(Edge) 호스트 파싱→테넌트 힌트 헤더 전파. `lib/tenant/`(`host.ts` 순수 파서 / `resolve.ts` DB 해석 / `context.ts` `getTenant`·`requireTenant`). 서브도메인→`church.code`(커스텀 도메인은 Phase 4). 미등록→404. `NEXT_PUBLIC_ROOT_DOMAIN`. 진단: `GET /api/tenant`(dev 전용).
- **구현됨(0.5):** 자체 JWT 인증. `lib/auth/`(`jwt` jose HS256 / `password` scrypt / `tokens` 리프레시(해시저장·회전·취소) / `users` / `session` login·refresh·logout·getCurrentUser·requireUser). 액세스=httpOnly 쿠키(15분), 리프레시=DB(30일, 취소가능). 라우트 `/api/auth/{login,refresh,logout,me,dev-seed}`. `(app)` 레이아웃 `requireUser` 가드 + `/login` 페이지. `JWT_SECRET` 필수. 교회는 호스트(테넌트)로 해석.
- **구현됨(0.6):** RBAC. `lib/rbac/`(`roles` 역할/권한 정의·역할→권한 맵·hasRole/hasPermission / `seed` seedDefaultRoles·assignRole / `guards` requireRole·requirePermission·checkRole). 기본 역할 `admin/staff/viewer`. 가드 시연: `GET /api/admin/ping`(admin만). `/forbidden` 페이지. dev-seed 가 역할 시드·부여.
- **구현됨(0.7 ★ 게이트):** vitest 테스트 러너(`server-only`는 빈 모듈로 alias). `test/`: RLS 격리(스코프·타교회 INSERT 차단·미설정 0행·시스템 우회) · 인증·RBAC 격리 · 호스트 파싱 · 인증 프리미티브 · 온보딩. 20 tests 통과. `npm run test`. **GitHub Actions CI**(`.github/workflows/ci.yml`: Postgres 서비스→migrate→lint/typecheck/test/build).
- **구현됨(0.8):** 온보딩. billing 스키마(`plan` 전역 / `subscription`·`church_storage_usage` 테넌트+RLS). `lib/onboarding/onboard.ts`(교회+기본역할+관리자+구독+사용량, 단일 트랜잭션 원자적, 코드 검증·중복거부). 공개 `POST /api/onboard` + `/onboard` 가입 페이지. 공개 랜딩(가입/로그인 안내) ↔ `(app)` 인증 가드로 공개/인증 분리 완성.
- **완료 게이트 통과:** 새 교회 온보딩→서브도메인 로그인→권한(admin) 동작 E2E 검증. → **Phase 1(자산) 착수 가능.**

> 작업을 끝낼 때마다 이 섹션(현재 단계/완료된 작업)을 갱신해 다음 세션이 상태를 즉시 파악하게 하세요.

---

## 3. 빌드 순서 & Phase 0 작업 분해

빌드 순서(스펙 §1, §8): **코어 → 비품(자산) → 교적 → 재정 → 홈페이지 → 고도화.**

Phase 0 작업 의존성(스펙 §15):

```
0.1 스캐폴드
   └─> 0.2 코어 스키마
          ├─> 0.3 RLS 정책        ┐ (병렬 가능)
          └─> 0.4 테넌트 미들웨어   ┘
                 └─> 0.5 인증(JWT)  ┐ (병렬 가능)
                 └─> 0.6 RBAC      ┘
                        └─> 0.7 테넌트 격리 자동 테스트  ← 완료 게이트
                               └─> 0.8 온보딩 & 공통 UI 기반
```

- **작업 단위 = 1 세션 / 1 PR.** 순서 의존성을 지킨다.
- **완료 게이트:** `0.7`(격리 통합 테스트) 통과 + 새 교회 온보딩→로그인→권한 동작 → **Phase 1(자산) 착수.**
- 각 작업의 "완료 기준"은 스펙 §15 표를 따른다.

Phase 0 이후 모듈은 스펙 §16의 6단계 패턴 반복: 도메인 스키마(+`church_id`) → RLS → 도메인 로직(복잡 집계는 raw SQL/뷰) → API/서버액션+권한가드 → 화면 → 격리·권한 테스트.

---

## 4. 코딩 규칙 (불변 — 위반 금지)

스펙 §17. **모든 PR에서 강제됨:**

1. 모든 테넌트 테이블에 **`church_id`** (예외 없음).
2. 모든 DB 접근은 **RLS 경유** — 커넥션마다 `set app.church_id` 세션 변수 설정.
3. 복잡 쿼리는 **raw SQL / Postgres 뷰** — 모든 걸 ORM 객체로 강제하지 않는다(스펙 §4).
4. 금액은 **부동소수점 금지** — `numeric` 또는 최소 단위 정수(원).
5. 파일은 **S3 어댑터(`lib/storage`) 경유** — 직접 디스크 접근 금지.
6. 공개 영역(`app/(public)`)은 **민감 테이블 직접 접근 금지** — 발행 콘텐츠/접수(intake) 테이블만.
7. 각 모듈은 별도 디렉터리/도메인 경계로 분리.
8. 인증 토큰은 **짧은 액세스 JWT + DB 리프레시(취소 가능)** — 영구 토큰 금지.

추가 아키텍처 원칙(스펙 §2): 무상태 앱 서버(인스턴스 메모리에 상태 금지), 교인 데이터 단일 원본(타 모듈은 `member_id` 참조만), 공개/내부 경계를 코드·권한·캐싱으로 분리.

---

## 5. 명령어

```bash
# 첫 셋업
cp .env.example .env   # 로컬 기본값으로 충분
npm install
npm run db:up          # docker compose up -d (Postgres 16)
npm run db:migrate     # 마이그레이션 적용
npm run dev            # http://localhost:3000

# 로컬 DB (Postgres, docker)
npm run db:up          # docker compose up -d
npm run db:down        # docker compose down (데이터 유지; 초기화는 docker compose down -v)

# 개발 / 빌드 / 기동
npm run dev            # next dev (Turbopack 기본 — Next 16)
npm run build
npm run start

# DB / 마이그레이션 (Drizzle)
npm run db:generate    # 스키마 변경 → 마이그레이션 SQL 생성 (DB 불필요)
npm run db:migrate     # 마이그레이션 적용 (DB 필요)
npm run db:push        # 스키마를 DB에 직접 반영(개발용, 마이그레이션 파일 없이)
npm run db:studio      # Drizzle Studio

# 품질 게이트
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
# npm run test         # (테스트 러너는 0.7에서 도입)
```

**환경 요건:** Node 20+ (Next 16). Docker(로컬 Postgres). `.env`로 `DATABASE_URL` 등 설정(이후 JWT/스토리지 추가).

---

## 6. 프로젝트 구조 (목표 — 스펙 §13)

```
app/
  (public)/          # 공개 홈페이지 (SSG/ISR, SEO) — 민감 테이블 직접 접근 금지
  (app)/             # 인증 대시보드 (SSR) — dashboard/ members/ finance/ assets/
proxy.ts             # (Next 16: middleware→proxy) 호스트 → church_id 해석·인증·컨텍스트 주입
lib/
  db/                # Drizzle 데이터 계층(+schema/) + RLS 세션 변수 + 뷰/raw SQL
  auth/              # JWT/세션/리프레시
  storage/           # S3 어댑터(SeaweedFS)
  tenant/            # 테넌트 컨텍스트 유틸
jobs/                # 워커(pg-boss / Graphile Worker)
drizzle/             # 생성된 마이그레이션 SQL
drizzle.config.ts    # drizzle-kit 설정
docker-compose.yml   # 로컬 Postgres
```

라우트 그룹으로 공개/인증 경계를 **구조로 강제**한다.
> Next 16에서 `middleware` 규칙이 `proxy`로 대체됨(스펙 §1 결정 로그). 스펙 §13의 `middleware.ts`는 `proxy.ts`로 읽는다.

---

## 7. 작업 워크플로 (에이전트용)

1. **시작 전:** 스펙에서 해당 작업의 결정·완료 기준을 확인하고, §2 현재 상태를 읽는다.
2. **범위:** 한 번에 한 작업(1 PR). 의존 선행 작업이 안 끝났으면 먼저 처리하거나 사용자에게 알린다.
3. **데이터 계층:** 단순 CRUD는 Drizzle 쿼리 빌더, 복잡 집계는 raw SQL/뷰(스펙 §4).
4. **테넌시:** 새 테이블은 반드시 `church_id` + RLS 정책 + 인덱스. 격리 테스트 추가.
5. **검증:** 변경마다 `lint`/`typecheck`/`test`를 (가능해지면) 통과시킨다. 멀티테넌트 격리는 항상 테스트로 증명.
6. **문서 갱신:** 결정이 바뀌면 스펙 §1 결정 로그를 갱신. 진행 상태가 바뀌면 이 문서 §2를 갱신.
7. **커밋/푸시는 사용자가 요청할 때만.** 기본 브랜치면 먼저 브랜치를 판다.

---

## 8. 참고 문서

- **[`church-saas-final-spec.md`](./church-saas-final-spec.md)** — 단일 기준 문서(도메인·아키텍처·ERD·로드맵·컴플라이언스). 충돌 시 항상 우선.
- 한국 특화/컴플라이언스(PIPA 민감정보, PG, 기부금영수증, 소셜로그인)는 스펙 §14 참조.
