# 디자인 시스템 적용 진행 현황 (재적용)

> 기준 문서: [`DESIGNE.md`](../DESIGNE.md) (작업 지시서, Phase D0~D5)
> **맥락:** 1차 시도(PR #27 · 브랜치 `feat/design-system`)는 모듈 플랫폼 마이그레이션(M0~M4)과
> 25커밋·57파일 충돌로 닫혔다. 그 브랜치를 **청사진**으로 삼아 **현재 main(모듈 플랫폼 완료)
> 위에 단계별로 재적용**한다. 화면(app 라우트)은 단일배포라 앱에 잔류하고, 모듈 lib 은
> 이미 `@church/module-*`·`@church/core/*` 로 분리돼 있다(import 경로 주의).

## 진행 체크리스트 (현재 main 기준)

### Phase D0. 기반 정리 — ✅ 완료 (재적용)
- [x] `class-variance-authority`·`@radix-ui/react-slot`·`lucide-react` 설치(pnpm)
- [x] `globals.css` 상태토큰(`--success/--warning/--info` + foreground, 테마 4종) + `@theme inline`
- [x] `button.tsx` cva화(variant·size·`asChild`), `card.tsx` 서브컴포넌트, `badge.tsx` 토큰화, `form.tsx` `Field` 계열
- [x] 신규 `table.tsx`·`empty-state.tsx`·`skeleton.tsx`·`page.tsx`(PageHeader)
- [x] 로그인 화면 `Field`/`Button`+lucide 적용
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅ / test ✅ (122 pass / 1 skip)

### Phase D1. AppShell 개선 — ✅ 완료 (재적용)
- [x] `app/(app)/app-shell.tsx` 분해 → `lib/ui/app/*`(types·module-nav·app-sidebar)
- [x] §7.1 레이아웃(max-w-7xl·반응형 `px-4 md:px-8`), 모바일 가로스크롤 하위메뉴(`MobileSubnav`), lucide(User), `aria-current`
- [x] 현 M2 레지스트리 셸 props 계약(`modules`/`personal`/`userName`) 그대로 유지 — 청사진 `lib/ui/app/types` 가 현 `NavModule`/active 로직과 동일해 호환. layout.tsx 무변경.
- [x] 품질게이트: typecheck ✅ / lint ✅ / build ✅

### Phase D2. 목록/테이블 — ⬜ 대기
- [ ] 신규 `lib/ui/filter-bar.tsx`
- [ ] members·finance·assets·forms 목록 + finance 하위 + platform 대시보드 → PageHeader·FilterBar·Table·Badge·EmptyState, 금액 우측정렬 tabular-nums
- [ ] 의미색 토큰화(`text-green→success`·`text-amber→warning`·수입 `text-blue→info`)

### Phase D3. 폼/상세 — ⬜ 대기
- [ ] 신규 `lib/ui/description-list.tsx`
- [ ] 교인·자산 상세 → PageHeader·DescriptionList·Badge·위험액션 분리
- [ ] 공유 폼 `member-form`·`asset-form`·`finance/new` 등 `Field` 화(label↔input·필수·inputMode)

### Phase D4. 공개 사이트 분리 — ⬜ 대기
- [ ] 신규 `lib/ui/public-site/*`(header·container/shell/footer·section·post-list)
- [ ] 공개 홈·게시판·페이지·게시글·online 폼 3종 전환, 내부 앱과 톤 분리(교회별 `data-theme` 유지)

### Phase D5. QA/문서 + 색상 lint — ⬜ 대기
- [ ] **금지색 lint 자동화** — `eslint.config.mjs` `no-restricted-syntax`(.tsx)로 원시 색상 스케일·black/white error. (기존 boundary `no-restricted-imports` 규칙과 공존하도록 병합)
- [ ] AGENTS.md 디자인 규칙 갱신, 역할별(staff/viewer/member) 화면 점검

## 작업 로그
- **D0 재적용** — 청사진 브랜치(`feat/design-system` `740466c`)에서 프리미티브·토큰·login 을
  현재 main 으로 이식, pnpm 의존성 추가. 게이트 green(122 pass). app 라우트 미변경(충돌 0).
- **D1 재적용** — `lib/ui/app/*`(types·module-nav·app-sidebar) 도입 + `app-shell.tsx` 를
  청사진 버전으로 교체(반응형·모바일 subnav·lucide). 청사진 types 가 현 M2 셸 props 와
  동일해 깨끗한 교체, layout.tsx 무변경. 게이트 green.
- D2~D5 — 화면 적용을 현재 main 구조(`@church/module-*` import·모듈 레이아웃·가드)에
  맞춰 단계별 재적용 예정. 충돌 마커 수동해소 대신 재구현.
