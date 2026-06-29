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

- **단계: ✅ 전체 완료 — 스펙 로드맵(Phase 0~5) + 보완(Phase 6) + UX 보강(페이지네이션·디자인 시스템/테마) + 설문·보고 모듈(셀프 제출·파일첨부·xlsx 포함) + 교적 직분 연동 + 알림 실송출 잡 연결 + 보안 보강(경로조작·RBAC 읽기가드·스토리지 루트 필수화). 92 tests(+1 skipped: 실 S3 라운드트립), CI green, 모두 main 병합.** (다음 후보: §14 외부연동[실채널 드라이버·PG·소셜로그인] — 계정·환경 필요. §12 배포는 Docker 구성 완료 — 실서버 기동·TLS·다중 인스턴스 운영만 남음.)
- **구현됨(보안 보강 후속 · STORAGE_LOCAL_DIR 필수화):** 로컬 스토리지 루트를 `STORAGE_LOCAL_DIR` 로 **명시 필수**(`process.cwd()` 폴백 제거 → Turbopack "whole project traced" 경고 해소). 루트는 모듈 로드시점이 아닌 `LocalDiskAdapter` 생성자에서 읽어 s3 드라이버 선택 시 import 만으로 실패하지 않음. 미설정 시 명확히 throw. 배선: `.env.example`(`STORAGE_LOCAL_DIR=.storage`)·테스트 기본값(`test/setup.ts` tmpdir)·운영(이미지 기본 `/data/storage`+compose `appstorage` 볼륨을 app/worker 공유 마운트, `deploy/.env.prod.example`·README). 단위테스트 5건(미설정 throw 포함).
- **구현됨(보안 보강 · 경로조작/RBAC 읽기가드):** ① 로컬 스토리지 어댑터 경로조작(path traversal) 차단 — `lib/storage/local.ts`에 `resolveKey`(키를 ROOT 하위 절대경로로 해석, `..`·절대경로로 ROOT 밖이면 거부) 추가해 put/get/delete 적용. 다운로드 라우트 `app/(app)/files/route.ts`도 `..` 세그먼트 키 거부(심층방어). ② 교적/자산 **읽기** 페이지(`members` 목록·상세·통계, `assets` 목록·상세·라벨)에 read 권한 가드 추가(`requirePermission`/`hasPermission`) — member 역할(셀프포털)의 직접 URL 접근 차단. RLS는 교회 간 격리만 보장하므로 역할별 읽기 차단은 앱 레벨 가드로 강제. ③ 로컬 어댑터 경로조작 단위테스트 4건 추가(`test/storage-local.test.ts`, DB 불필요 — 통과). ※ DB 연동 통합 스위트는 이 환경(Docker 미가동)에서 재실행하지 못함.
- **구현됨(설문 xlsx 내보내기):** 응답 Excel(xlsx) 내보내기. `exceljs` 의존성 추가. `lib/forms/aggregate.ts`의 `buildResponseRows`(헤더+행, CSV/xlsx 공유)로 추출, `lib/forms/xlsx.ts`(exceljs 워크북→Buffer, 화면 번들 제외 위해 별도 모듈). 내보내기 라우트 `?format=xlsx` 분기. 집계 화면에 CSV/Excel 링크. 테스트(83 tests).
- **구현됨(설문 파일 첨부 · file 문항):** `file` 문항 실제 업로드(`lib/storage` 어댑터 경유, 쿼터 `reserveUsage` 확인). `lib/storage` 어댑터에 `get()` 추가(다운로드용). `lib/forms/files.ts`(storeFormFile·collectAnswers — 텍스트/선택/파일 통합 수집, parseFileAnswer). 제출 액션(public·my) collectAnswers로 통합. 다운로드 라우트 `app/(app)/files`(인증+교회 프리픽스 검증). 응답 상세/셀프 읽기전용/CSV에서 파일=파일명 다운로드 링크. 답변 value=JSON{key,name,size}. 테스트(82 tests).
- **구현됨(설문 셀프 제출 · §6 워크플로 완성):** 배정된 교인이 로그인해 본인 보고서를 작성·제출. `lib/forms/my.ts`(listMyAssignments·getMyFillForm·submitMyResponse·myResponseDetail — **memberId 소유권 강제**, 발행/중복 검증)+`my-actions.ts`(requireUser+getUserMember). `/my/forms`(내 배정 목록)·`/my/forms/[assignmentId]`(작성/제출, 제출 후 읽기전용). 셀프포털 네비/`/my`에 링크. forms 권한 불필요(본인 데이터). 격리·소유권·중복·미발행 테스트(80 tests).
- **구현됨(교적 직분 연동 · PRE-1 후속):** 교인 폼의 직분을 자유텍스트 → **직분 마스터(`position`) 드롭다운**으로. `member.position_id` 사용. service `MemberInput.positionId`+UPDATABLE, member-form `positions` 셀렉트, new/edit 페이지 `listPositions` 전달, 상세/목록은 `positionLabelMap`로 라벨 표시(legacy 텍스트 fallback). 통계 `byPosition`은 `coalesce(position.label, member.position)` 집계(코드 우선·레거시 fallback). 레거시 `position` 텍스트는 보존(편집 시 미덮어씀). 78 tests.
- **구현됨(S.2~S.7 · 설문/보고 엔진 — `module-survey-report.md` §4·§10):** 공유 설문/보고 모듈 완성. RBAC `forms:read`/`forms:write`(admin·staff write, viewer read). **S.2 폼 빌더**(`lib/forms/service.ts` 폼/문항 CRUD·발행/마감, `/forms`·`/forms/[formId]` + 상위 네비). **S.3 응답 제출/수집**(`responses.ts`, 익명 공개=intake 경계 `public-actions.ts`+`app/(public)/online/forms/[formId]`, 관리자 `responses` 목록/상세). **S.4 역할기반 자동배정**(`assignments.ts` autoAssignByRole — PRE.0 `org_membership`/`listMembersByOrgRole` 활용, 제출현황 대시보드 `/forms/[formId]/assignments`). **S.5 집계**(`aggregate.ts` raw SQL: 문항분포·속별 제출률·CSV 내보내기 route). **S.6 미제출 독려 잡**(`remind.ts`+`JOBS.FORMS_REMIND` 워커, `lib/notify` 재사용). **S.7 통합테스트**(타교회 차단·권한맵·공개 경계). 76 tests. → 설문·보고 모듈 완료.
- **구현됨(S.1 · 설문/보고 엔진 스키마 — `module-survey-report.md` §3):** 공유 설문 엔진 스키마. `form`·`form_field`·`form_assignment`·`form_response`·`form_answer` 스키마+RLS(0033/0034). 전 테이블 `church_id`+인덱스(제출현황 집계용 `(church_id, form_id, status)` 등). 익명 응답 대비 `form_response.member_id`/`assignment_id` nullable(배정당 제출 unique=중복차단, 익명은 nulls distinct 무제한). enum 코드+라벨맵 `lib/forms/constants.ts`(category survey/report·status draft/published/closed·문항타입 8종·배정상태 pending/submitted/reviewed). 격리·체인·익명·중복차단 테스트(62 tests). → 다음: 폼 빌더(S.2).
- **구현됨(PRE.0 · 설문/보고 모듈 선행보강 — `module-survey-report.md` §5.1):** 교적 조직/직분 보강. `position`(직분 마스터)·`org_role`(직책 마스터, `is_leader`)·`org_membership`(연도별 편성) 스키마+RLS(0031/0032). `member.position_id` FK(기존 `position` 텍스트는 레거시). `lib/members/org.ts`(직분/직책 CRUD·연도별 편성 upsert·`listLeaders`=리더 보고 타게팅 근거)+`org-actions.ts`(members:write)+`org-constants.ts`(기본 직분/직책 시드, 온보딩 트랜잭션에 포함). `/members/org`(직분·직책 관리)·`/members/org/assignments`(연도별 편성). 매년 속회 개편·다중 소속·이력 지원. 격리·멱등시드·연도분리·리더식별 테스트(58 tests). → 다음: 설문 엔진 스키마(S.1).
- **UX 보강 — 페이지네이션:** `lib/db/pagination`(pageParams/toPaged) + `app/(app)/pagination`(필터 보존). 교적·비품·재정 목록 limit/offset+count. 재정 합계는 전체 필터 기준(`voucherTotals`). 55 tests.
- **UX 보강 — 디자인 시스템/테마:** 색상=CSS 토큰(`app/globals.css`), `data-theme`로 테마 교체(modern/warm/minimal/dark). Pretendard 폰트(layout `<link>`). 프리미티브 `lib/ui`(Button/Card/form/Badge) + `cn`(`lib/utils`, clsx+tailwind-merge). 앱: 사이드바 테마 토글(localStorage, `useSyncExternalStore`). 공개사이트: 교회별 `site.theme`(`/site`에서 선택 → 공개 래퍼 `data-theme`, `getPublicSiteTheme`). 고정색상→토큰 일괄 치환(39파일). 의미색(수입=파랑·성공=초록·경고=앰버)은 의도적 고정. **새 화면은 `lib/ui` 프리미티브와 토큰 색(bg-background/foreground/card/muted/border/primary/destructive)만 사용 — `text-gray-*`·`border-black/*` 금지.**
- **구현됨(SMS/알림톡 실송출 잡 연결 · §14):** 채널 프로바이더 추상화 `lib/notify/provider.ts`(`NOTIFY_DRIVER`, 기본 log=mock·실채널 env 게이트, 스토리지 어댑터와 동일 패턴). 발송 흐름을 **큐(queued) → 워커 송출 → status sent/failed**로 전환. `service.ts`(queueToActiveMembers·queueToMembers·**processNotifications**=프로바이더 송출+상태갱신, sendTo* = 즉시발송 래퍼). `notification`에 `provider_ref`·`error` 컬럼(0035). 워커 `JOBS.NOTIFY_SEND` → processNotifications **연결**. `/members/notify` 액션 비동기(큐+잡 적재). 실채널(알리고/SENS/Solapi)은 드라이버 연동만 남음. 테스트(85 tests).
- **Phase 5 구현됨(P5.3):** 문자/알림. `notification` 스키마+RLS(0027/0028). `lib/notify`. `/members/notify`. (위 §14 실송출 연결로 mock→프로바이더 구조 전환.)
- **남은 외부연동/인프라(§12·§14 — 코드 인터페이스/mock까지 준비됨):** 실제 PG(온라인헌금)·국세청 전자제출(기부금영수증)·SMS/알림톡 **실채널 드라이버**(잡·프로바이더 연결 완료 — 알리고/SENS/Solapi 자격증명·드라이버만)·소셜로그인(카카오/네이버)·네이티브 모바일앱·**배포 운영**(Docker/nginx/PgBouncer 구성은 완료[아래] — 실서버 TLS/certbot·실제 다중 인스턴스 스케일아웃만)·저장 암호화/파기정책. (S3(SeaweedFS) 어댑터는 구현 완료 — 아래 §10 항목.)
- **Phase 5 구현됨(P5.2):** QR 키오스크 출석. `/members/kiosk`(탭 토글, 오늘 주일예배), `/members/kiosk/[memberId]`(QR 스캔 체크인), `/members/labels`(교인 QR=키오스크 딥링크). `kioskSetAction`(saveAttendance 재사용).
- **Phase 6 구현됨(P6.1):** 교인 셀프포털. `member` 역할, `lib/members/portal`(계정발급·본인정보·본인 헌금내역), `/my`·`/my/giving`. (app) 네비 권한별 필터.
- **Phase 6 구현됨(P6.2):** 저장소 어댑터(`lib/storage` 인터페이스+로컬+사용량/쿼터, §10) · 백그라운드 잡(`lib/jobs`+`jobs/worker.ts` pg-boss, `npm run worker`, §11).
- **구현됨(배포 구성 · Docker · §12):** `Dockerfile`(멀티스테이지, app=`next start`+worker=`tsx` 단일 이미지)·`.dockerignore`. `deploy/`: `docker-compose.prod.yml`(nginx·app·worker·postgres + 확장용 pgbouncer[profile scale]·seaweedfs[profile storage])·`nginx/church-suite.conf`(서브도메인 테넌트 해석 위해 `Host` 보존·정적 캐시·TLS 주석)·`.env.prod.example`·`README.md`(빌드/마이그/기동/회전/TLS/확장). pg-boss·마이그레이션은 Postgres 직접, 앱 런타임만 PgBouncer 경유. **운영 이미지 `docker build` 검증 완료.** church_app 비번 회전 안내 포함.
- **구현됨(S3/SeaweedFS 어댑터 · §10):** `lib/storage/s3.ts`(`@aws-sdk/client-s3`, path-style=SeaweedFS/MinIO). `STORAGE_DRIVER=s3`로 활성. `getStorage()` 분기(local/s3). docker-compose `seaweedfs` 서비스(profile `storage`, S3 :8333). 실 SeaweedFS 대상 put/get/delete 라운드트립 검증(통합 테스트 `STORAGE_S3_TEST=1`, 평소 skip). url 와이어링·env 누락 단위 테스트. 87 tests.
- **Phase 6 구현됨(P6.3):** PIPA. `access_log`(접근로그)·`consent`(동의) 스키마+RLS(0029/0030). `lib/compliance`. 교인 상세 조회 시 접근기록, 새가족 폼 동의 수집, `/members/compliance`(admin) 감사. 51 tests.
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

### 4.1 모듈 플랫폼 규칙 (스펙 §1 P-1 · 상세 [`module-platform.md`](./module-platform.md))

> **결정됨 · 미구현.** 아래는 모듈 추출 작업(M0~M5)부터 강제된다. **현재 코드는 추출 전 베이스라인**이므로 위반으로 보지 않는다. 새 모듈 작업·리팩터는 이 규칙을 따른다.

1. **모듈 간 직접 결합 금지.** 모듈은 **코어만** import한다(모듈→모듈 import 금지, 코어→모듈 import 금지). 모듈 간/대시보드 통합은 **코어가 노출하는 읽기 계약(`readContracts`) 또는 Postgres 뷰**를 경유한다.
2. **모듈 소유 경계.** 각 모듈은 자기 **Postgres 스키마**(`finance.*`·`assets.*` 등), 자기 **마이그레이션**, 자기 **매니페스트**(`nav`/`permissions`/`ownedSchema`/`migrations`)를 소유·선언한다. 코어 공유 테이블(교회·사용자·권한·`member`·`department` 등)만 참조 가능.
3. **교회별 설치 = `installedModules: Set<ModuleKey>`.** 런타임/가드/네비는 이 Set만 본다. 번들↔애드온은 **가격 정책 레이어**에서만 결정(코드는 항상 Set 기반·애드온-ready). RBAC(권한)와 엔타이틀먼트(설치)는 직교 — 둘 다 통과해야 한다.
4. **단일 배포 유지(A안).** `apps/web` 하나로 빌드. 모듈 패키지는 *경계*용이며, 모듈별 독립 배포(B안)는 seam 불변이라 추후 추출 가능.

---

## 5. 명령어

> **패키지 매니저 = pnpm (워크스페이스, 스펙 §1 P-1 / M0b).** `corepack enable` 후 사용(`packageManager` 필드가 버전 고정). 코어/모듈은 `packages/*`.

```bash
# 첫 셋업
corepack enable        # pnpm 활성화(packageManager 버전 사용)
cp .env.example .env    # 로컬 기본값으로 충분
pnpm install
pnpm run db:up         # docker compose up -d (Postgres 16)
pnpm run db:migrate    # 마이그레이션 적용
pnpm run dev           # http://localhost:3000

# 로컬 DB (Postgres, docker)
pnpm run db:up         # docker compose up -d
pnpm run db:down       # docker compose down (데이터 유지; 초기화는 docker compose down -v)

# 개발 / 빌드 / 기동
pnpm run dev           # next dev (Turbopack 기본 — Next 16)
pnpm run build
pnpm run start

# DB / 마이그레이션 (Drizzle)
pnpm run db:generate   # 스키마 변경 → 마이그레이션 SQL 생성 (DB 불필요)
pnpm run db:migrate    # 마이그레이션 적용 (DB 필요)
pnpm run db:push       # 스키마를 DB에 직접 반영(개발용, 마이그레이션 파일 없이)
pnpm run db:studio     # Drizzle Studio

# 품질 게이트
pnpm run lint          # eslint
pnpm run typecheck     # tsc --noEmit
pnpm run test          # vitest (Postgres 필요)
```

**환경 요건:** Node 20+ (Next 16) · **pnpm**(corepack). Docker(로컬 Postgres). `.env`로 `DATABASE_URL` 등 설정.

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
- **[`module-survey-report.md`](./module-survey-report.md)** — 동반 모듈 설계 문서: 설문·보고(범용 설문 엔진=공유 모듈 + 역할기반 보고=교적 연동). 착수 전 교적 선행보강(직분/직책 마스터·연도별 조직 편성 `org_membership`) 필요. 로드맵 미확정.
- 한국 특화/컴플라이언스(PIPA 민감정보, PG, 기부금영수증, 소셜로그인)는 스펙 §14 참조.
