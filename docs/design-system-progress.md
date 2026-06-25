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

### Phase D1. AppShell 개선 (= PR2)

- [ ] `app-shell.tsx` 분해 → `lib/ui/app/*`
- [ ] 사이드바 active·상단 nav·사용자 액션 시각계층, lucide 아이콘
- [ ] 모바일 동작, ThemeToggle 정리
- [ ] 품질게이트

### Phase D2. 목록/테이블 (= PR3)

- [ ] `/members` `/finance` `/assets` `/forms` 등 `Table·FilterBar·Badge·Pagination·EmptyState` 적용
- [ ] 금액/숫자 오른쪽 정렬, 상태 Badge
- [ ] 품질게이트

### Phase D3. 폼/상세 (= PR4)

- [ ] 교인/전표/자산/폼 등록·수정·상세 `Field`·`DescriptionList`
- [ ] 위험 액션 분리, 서버액션 에러 표시 표준화
- [ ] 품질게이트

### Phase D4. 공개 사이트 분리 (= PR5)

- [ ] `lib/ui/public-site/*`
- [ ] 공개 홈/게시판/페이지/새가족/온라인헌금 톤 분리
- [ ] 품질게이트(+build)

### Phase D5. QA/문서

- [ ] AGENTS.md 디자인 규칙 갱신
- [ ] 주요 화면 캡처 갱신
- [ ] 금지색 규칙 lint/리뷰 반영

## 작업 로그

- (진행 중) Phase D0 착수 — 의존성 설치 완료.
