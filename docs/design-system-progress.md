# 디자인 시스템 적용 진행 현황

> 기준 문서: [`DESIGNE.md`](../DESIGNE.md) (작업 지시서)
> 이 문서는 DESIGNE.md의 Phase D0~D5 적용 진행 상황을 추적한다.

## 검토 요약 (시작 시점)

도메인 기능 구현(교적·재정·비품·설문·홈피·셀프포털, 페이지 47개)은 성숙했으나,
DESIGNE.md가 지시하는 **디자인 시스템 적용(Phase D0~D5)은 미착수** 상태에서 시작.

시작 시점 격차:

- §4 의존성: radix/cva/lucide **0/9 설치**
- §6 `lib/ui`: 4/13 (`button·card·badge·form`만), `lib/ui/app`·`lib/ui/public-site` 없음
- `button` cva·asChild 없음(`primary|outline|ghost|destructive` × `sm|md`)
- `card` 서브컴포넌트 없음, `form` Field 계열 없음, `badge` raw 색상(green/amber)
- §5.2 상태토큰(`--success/--warning/--info`) 없음
- §8.2 `Table` 컴포넌트 없음 → raw `<table>` 12파일
- `loading.tsx` 0개, lucide 0건
- lib/ui 채택 3파일 vs raw `<button>` 34파일
- 긍정: 명시 금지색(gray/slate/black/white) 사용 0건, `data-theme`/`@theme inline` 토큰 구조 정상

## 진행 체크리스트

### Phase D0. 기반 정리 (= PR1) — ✅ 완료

- [x] `class-variance-authority`, `@radix-ui/react-slot`, `lucide-react` 설치
- [x] `globals.css` 상태토큰(`--success/--warning/--info` + foreground, 테마 4종) + `@theme inline` 연결
- [x] `button.tsx` cva화(variant `primary|secondary|outline|ghost|destructive`, size `sm|md|lg|icon`, `asChild` via radix-slot)
- [x] `card.tsx` `CardHeader/CardTitle/CardDescription/CardContent/CardFooter`
- [x] `badge.tsx` 토큰화(`default|success|warning|info|destructive|muted`, raw 색상 제거)
- [x] `form.tsx` `Field/FieldLabel/FieldDescription/FieldError`
- [x] 신규 `table.tsx`, `empty-state.tsx`, `skeleton.tsx`, `page.tsx`(PageHeader 계열)
- [x] 로그인 화면에 새 프리미티브 적용(`Field`/`FieldLabel`/`Input`/`Button`+lucide, label↔input 연결)
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅ / test ✅ (44파일 101 pass / 1 skip)

### Phase D1. AppShell 개선 (= PR2) — ✅ 완료

- [x] `app-shell.tsx` 분해 → `lib/ui/app/*`(`types.ts`·`module-nav.tsx`·`app-sidebar.tsx`)
- [x] 사이드바 active(`aria-current`)·상단 nav·사용자 액션 + lucide(User/LogOut)
- [x] 모바일: 사이드바 `md` 이상만, 모바일 가로 스크롤 하위메뉴(`MobileSubnav`); §7.1 `main`(max-w-7xl 컨테이너·반응형 패딩) 적용
- [~] ThemeToggle 정리는 보류(기존 native select 유지 — Radix Select는 D 후속)
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅ / test ✅(D1 후 재실행)

### Phase D2. 목록/테이블 (= PR3) — 🟡 핵심 적용

- [x] 신규 `lib/ui/filter-bar.tsx`
- [x] `/members` — PageHeader·FilterBar·Table·Badge(상태)·EmptyState·권한별 액션
- [x] `/finance` — 위 + 금액 우측정렬 tabular-nums·토큰색(info/destructive)·삭제 위험액션 분리
- [x] `/assets` — 위 + 상태 칩 필터·Badge
- [x] 금액/숫자 오른쪽 정렬, 상태 Badge(토큰)
- [x] 실데이터 시각 확인(manualdemo): 콘솔 에러 0
- [x] 나머지 목록 9파일 전환(병렬): `/forms`·`forms/[formId]/assignments`·`forms/[formId]/report`, finance `accounts`·`report`·`receipts`·`receipts/[memberId]`, `members/org/assignments`, `my/giving`
- [x] 잔여 페이지 색상/Badge 정리(병렬): `site/offerings`·`site/new-family`·`site/boards/[boardId]`·`my/forms`·`members/kiosk`
- [x] 추가 의미색 토큰화: compliance·kiosk/[memberId]·assets/audits/[auditId]·finance/new·public online 폼 3종 (`text-green-600→text-success`, `text-amber-600→text-warning`)
- [x] **금지색 0건 달성**(전체 app/lib .tsx 스윕 통과)
- [x] `app/platform` 대시보드 → PageHeader·Table·Badge·Card (raw `<table>` 전체 0건 달성)
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅ / test ✅(101 pass)

### Phase D4. 공개 사이트 분리 (= PR5) — ✅ 핵심 완료

- [x] `lib/ui/public-site/*` 신규: `public-header`·`public-container`(Shell/Footer)·`public-section`·`public-post-list`
- [x] `app/(public)/site-header.tsx` → `PublicHeader` 재노출(4페이지 하위호환)
- [x] 공개 홈(`/`)·게시판(`/b/[slug]`) 새 컴포넌트로 전환, CTA를 Button 으로
- [x] 교회별 `data-theme` 적용 구조 유지(layout)
- [x] 실데이터 시각 확인(manualdemo 공개 홈·새가족 폼): 콘솔 에러 0, 내부 앱과 톤 분리
- [x] 잔여 공개 페이지 전환: `p/[slug]`·`b/[slug]/[postId]`·online 폼 3종(new-family/offering/forms[formId]) → PublicShell/Container + Field
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅

### Phase D3. 폼/상세 (= PR4)

- [ ] 교인/전표/자산/폼 등록·수정·상세 `Field`·`DescriptionList`
- [ ] 위험 액션 분리, 서버액션 에러 표시 표준화
- [ ] 품질게이트

### Phase D4. 공개 사이트 분리 (= PR5)

- [ ] `lib/ui/public-site/*`
- [ ] 공개 홈/게시판/페이지/새가족/온라인헌금 톤 분리
- [ ] 품질게이트(+build)

### Phase D5. QA/문서 — ✅ 핵심 완료

- [x] AGENTS.md 디자인 규칙 갱신(shadcn 스타일·lib/ui 프리미티브 목록·이 문서 포인터)
- [x] 주요 화면 시각 확인(members/finance·교인 상세 내부 앱, 공개 홈·새가족 폼)
- [x] **금지색 규칙 lint 자동화** — `eslint.config.mjs` `no-restricted-syntax`로 원시 색상 스케일·black/white를 `.tsx`에서 error 처리(예외는 eslint-disable)
- [ ] 전 역할별(staff/viewer/member) 화면 점검은 후속

### Phase D3. 폼/상세 — 🟡 본보기 적용

- [x] 신규 `lib/ui/description-list.tsx`(DescriptionList/DescriptionItem)
- [x] 교인 상세(`members/[memberId]`)·자산 상세(`assets/[assetId]`) → PageHeader·DescriptionList·Badge·하위 Table·위험액션(삭제) 분리
- [x] 등록·수정 폼 `Field` 적용: 공유 폼 `member-form`·`asset-form`(전체 필드 Field화), `finance/new`, members/assets new·edit 페이지(제목/액션)
- [x] 실데이터 시각 확인(교인 상세, 공개 새가족 폼)
- [ ] 후속: 전표/폼 빌더 상세 `DescriptionList` 확산

## 작업 로그

- Phase D0 ✅ 커밋 `740466c` — 프리미티브/토큰/로그인 적용, 게이트 green.
- Phase D1 ✅ 커밋 `d6bb8b0` — AppShell 분해(lib/ui/app)·§7.1 레이아웃·모바일·lucide.
- Phase D2(핵심) ✅ 커밋 `afec3b7` — members/finance/assets 표준화, 실데이터 시각 확인.
- Phase D2(나머지 9파일) — 병렬 서브에이전트 전환, typecheck/lint/build green.
- Phase D4(핵심) — lib/ui/public-site 신규 + 공개 홈/게시판 전환, 공개 홈 시각 확인.
- Phase D3(본보기) — DescriptionList 신규 + 교인/자산 상세 전환, 교인 상세 시각 확인.
- 금지색 전수 제거 — **app/lib .tsx 금지색 0건**.
- 남은작업 라운드: D4 공개 잔여 5파일 + D3 폼(member-form/asset-form/finance/new + new·edit 페이지) + platform 테이블 + **eslint 금지색 규칙(no-restricted-syntax)**. raw `<table>` 0건, 금지색 0건, lint 규칙으로 회귀 차단.
- 남은 범위(후속): 전표/폼빌더 상세 DescriptionList 확산, 역할별 화면 점검.
