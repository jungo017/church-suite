# church-suite 디자인 시스템 작업 지시서

> 대상 저장소: `jungo017/church-suite`
> 목적: 현재 구현된 Next.js 16 + React 19 + Tailwind v4 기반의 멀티테넌트 교회 관리 SaaS에 일관된 디자인 시스템을 적용하기 위한 작업 지시서.
> 결론: `shadcn/ui` 스타일의 app-owned 컴포넌트 시스템을 `lib/ui` 아래에 흡수하고, Radix primitives와 Tailwind CSS 토큰을 기반으로 자체 디자인 시스템을 확장한다.

---

## 1. 배경

`church-suite`는 여러 교회가 함께 사용하는 멀티테넌트 교회 관리 SaaS다. 주요 영역은 다음과 같다.

- 내부 관리자 앱: 대시보드, 교적, 재정, 비품, 홈페이지 관리, 설문/보고
- 교인 셀프포털: 내 정보, 내 헌금내역, 내 설문/보고
- 공개 교회 홈페이지: 교회 홈, 게시판, 페이지, 새가족 등록, 온라인 헌금
- 플랫폼 관리자: SaaS 운영자용 관리 화면

현재 저장소는 이미 디자인 시스템을 시작하기 좋은 상태다.

- `app/globals.css`에 CSS 변수 기반 디자인 토큰이 있다.
- `data-theme="modern" | "warm" | "minimal" | "dark"` 테마 구조가 있다.
- `@theme inline`으로 Tailwind v4 토큰과 CSS 변수를 연결하고 있다.
- Pretendard 폰트를 전역 적용하고 있다.
- `lib/utils.ts`에 `cn()` 유틸이 있다.
- `lib/ui/button.tsx`, `lib/ui/form.tsx`에 기초 UI 프리미티브가 있다.
- `app/(app)/app-shell.tsx`에 상단 모듈 탭과 좌측 하위 메뉴 구조가 있다.

따라서 전체 UI 라이브러리를 교체하지 말고, 현재 구조를 살리면서 `lib/ui`를 확장한다.

---

## 2. 디자인 시스템 선택

### 최종 선택

내부 앱과 셀프포털은 다음 조합을 기준으로 한다.

```txt
Tailwind CSS v4
+ shadcn/ui conventions
+ Radix primitives
+ lucide-react icons
+ app-owned components in lib/ui
```

### 선택 이유

- 현재 프로젝트가 이미 Tailwind v4, CSS 변수, `cn()` 유틸, `lib/ui` 구조를 사용한다.
- shadcn/ui는 컴포넌트를 패키지로 숨기는 방식이 아니라 프로젝트 내부 코드로 소유하는 방식이어서 커스터마이징이 쉽다.
- 멀티테넌트 테마, 교회별 공개 사이트 테마, 다크모드에 잘 맞는다.
- 관리자 SaaS에 필요한 Button, Input, Select, Table, Dialog, Dropdown, Tabs, Badge, Toast, Sidebar 등의 패턴을 빠르게 표준화할 수 있다.
- Ant Design, MUI처럼 강한 기본 시각 언어에 제품이 끌려가지 않는다.

### 사용하지 않을 선택지

다음 디자인 시스템은 이번 프로젝트의 기본 방향으로 사용하지 않는다.

- Ant Design: 데이터 테이블과 폼은 강하지만 전체 제품이 엔터프라이즈 관리자 도구 느낌으로 고정될 가능성이 높다.
- MUI: Material Design 정체성이 강해서 교회 SaaS의 브랜드 유연성과 다소 맞지 않는다.
- Mantine: 좋은 선택지지만 현재 Tailwind 토큰 구조 위에 별도 스타일 시스템을 추가하는 비용이 있다.
- Carbon, Fluent: 대기업 업무 도구 느낌이 강하고 공개 교회 홈페이지와의 톤 차이가 커질 수 있다.

---

## 3. 핵심 원칙

### 3.1 내부 앱은 조용하고 실무 중심이어야 한다

교적, 재정, 비품, 설문/보고는 반복 입력과 확인이 많은 업무 화면이다. 화려한 랜딩 페이지처럼 만들지 않는다.

내부 앱의 목표:

- 빠른 스캔
- 명확한 상태 구분
- 안정적인 테이블과 폼
- 권한과 민감정보 경계의 명확한 표현
- 작은 화면에서도 업무가 가능한 반응형 구조

금지:

- 과한 히어로 섹션
- 장식용 그라디언트 배경
- 의미 없는 카드 남발
- UI 카드 안에 또 다른 카드 중첩
- 과도한 그림자와 둥근 모서리
- 회색/파랑 계열만 반복되는 단조로운 화면

### 3.2 공개 교회 홈페이지와 내부 관리자 앱을 분리한다

내부 앱과 공개 홈페이지는 같은 토큰을 공유하되 컴포넌트와 레이아웃은 분리한다.

권장 구조:

```txt
lib/ui/                  # 내부 앱과 공통으로 쓰는 낮은 수준 UI
lib/ui/app/              # 내부 관리자 앱 전용 조합 컴포넌트
lib/ui/public-site/      # 공개 교회 홈페이지 전용 조합 컴포넌트
```

내부 앱:

- 정보 밀도 높음
- 좌측 메뉴, 테이블, 필터, 액션 버튼 중심
- 업무 상태와 권한 피드백 중요

공개 홈페이지:

- 교회명, 예배 안내, 공지, 새가족 등록, 온라인 헌금 중심
- 콘텐츠 가독성, 모바일 접근성, 신뢰감 중요
- 내부 관리자 UI처럼 보이지 않아야 함

### 3.3 컴포넌트는 프로젝트가 소유한다

shadcn/ui 스타일을 따르되, 외부 UI 패키지에 화면 정체성을 맡기지 않는다.

원칙:

- `lib/ui` 컴포넌트는 프로젝트 내부에서 직접 수정 가능한 코드로 둔다.
- 페이지에서 반복되는 Tailwind 문자열을 직접 늘리지 않는다.
- 화면 단위에서 `rounded-md border border-border ...`를 반복하기보다 `Card`, `Table`, `Field`, `PageHeader` 같은 컴포넌트로 올린다.
- 컴포넌트 API는 복잡하게 만들지 않는다. 실제 사용 패턴이 생긴 뒤 변형을 추가한다.

---

## 4. 의존성 작업

현재 `package.json`에는 `clsx`, `tailwind-merge`가 이미 있다. 다음 의존성을 추가한다.

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-toast class-variance-authority lucide-react
```

선택적으로 필요할 때 추가:

```bash
npm install @radix-ui/react-checkbox @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-alert-dialog
```

주의:

- Ant Design, MUI, Mantine는 기본 의존성으로 추가하지 않는다.
- 데이터 테이블 라이브러리는 바로 추가하지 않는다. 먼저 native table + 작은 유틸 컴포넌트로 정리한다.
- 차트가 필요하면 별도 단계에서 `recharts` 또는 가벼운 SVG 기반 컴포넌트를 검토한다.

---

## 5. 토큰 정책

### 5.1 기존 토큰은 유지한다

`app/globals.css`의 기존 토큰은 유지한다.

현재 핵심 토큰:

```css
--background
--foreground
--card
--card-foreground
--muted
--muted-foreground
--border
--input
--primary
--primary-foreground
--accent
--accent-foreground
--destructive
--ring
--radius
```

Tailwind 사용 예:

```tsx
<div className="bg-background text-foreground" />
<div className="border border-border bg-card" />
<p className="text-muted-foreground" />
<button className="bg-primary text-primary-foreground" />
```

### 5.2 토큰 추가가 필요한 경우

상태 표현을 더 명확히 하기 위해 다음 토큰을 추가할 수 있다.

```css
--success: #15803d;
--success-foreground: #ffffff;
--warning: #b45309;
--warning-foreground: #ffffff;
--info: #2563eb;
--info-foreground: #ffffff;
```

Tailwind `@theme inline`에도 함께 연결한다.

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
```

의미색 사용:

- 성공/완료/활성: `success`
- 경고/검토 필요/마감 임박: `warning`
- 정보/안내/일반 강조: `info`
- 삭제/실패/위험: `destructive`

### 5.3 금지 색상

새 코드에서는 다음을 금지한다.

```txt
text-gray-*
bg-gray-*
border-gray-*
text-slate-*
bg-slate-*
border-slate-*
border-black/*
text-black
text-white
```

예외:

- 프린트 전용 QR 라벨
- 외부 브랜드 색상
- 차트 색상 팔레트
- 명확한 의미색이 필요한 통계 시각화

기본적으로 토큰 색상을 사용한다.

---

## 6. 컴포넌트 구조

### 6.1 기본 위치

기본 UI 컴포넌트는 `lib/ui`에 둔다.

```txt
lib/ui/
  badge.tsx
  button.tsx
  card.tsx
  dialog.tsx
  dropdown-menu.tsx
  empty-state.tsx
  form.tsx
  page.tsx
  select.tsx
  skeleton.tsx
  table.tsx
  tabs.tsx
  toast.tsx
```

조합 컴포넌트는 분리한다.

```txt
lib/ui/app/
  app-header.tsx
  app-sidebar.tsx
  app-shell.tsx
  breadcrumb.tsx
  module-nav.tsx
  page-actions.tsx

lib/ui/public-site/
  public-header.tsx
  public-container.tsx
  public-section.tsx
  public-post-list.tsx
```

### 6.2 네이밍

컴포넌트 이름:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Label`
- `Card`
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `Badge`
- `DataTable`
- `EmptyState`
- `PageHeader`
- `PageTitle`
- `PageDescription`
- `PageActions`

변형 이름:

```ts
variant: "primary" | "secondary" | "outline" | "ghost" | "destructive"
size: "sm" | "md" | "lg" | "icon"
```

현재 `Button`은 `primary | outline | ghost | destructive`, `sm | md`만 있다. shadcn 스타일에 맞춰 확장한다.

### 6.3 class-variance-authority 적용

`button.tsx`는 `class-variance-authority` 기반으로 정리한다.

요구사항:

- `asChild` 지원을 위해 `@radix-ui/react-slot` 사용
- `variant`, `size` 지원
- focus-visible ring 유지
- disabled 상태 유지
- 아이콘 버튼 크기 고정

예시 API:

```tsx
<Button>저장</Button>
<Button variant="outline">취소</Button>
<Button variant="destructive">삭제</Button>
<Button size="icon" aria-label="검색">
  <Search className="size-4" />
</Button>
<Button asChild>
  <Link href="/members/new">교인 등록</Link>
</Button>
```

---

## 7. 레이아웃 지침

### 7.1 내부 앱 레이아웃

현재 `app/(app)/app-shell.tsx`는 상단 모듈 탭과 좌측 하위 메뉴 구조다. 이 구조는 유지하되 시각 계층을 정리한다.

권장 구조:

```txt
AppShell
├─ AppHeader
│  ├─ Product/Church switch area
│  ├─ Top module nav
│  └─ User actions
├─ AppBody
│  ├─ AppSidebar
│  └─ Main
│     ├─ PageHeader
│     └─ PageContent
```

`main` 기본 스타일:

```tsx
<main className="min-w-0 flex-1 px-6 py-6 md:px-8">
  <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
    {children}
  </div>
</main>
```

내부 앱은 넓은 화면에서 `max-w-7xl`을 기본으로 한다. 교적/재정 테이블은 너무 좁게 제한하지 않는다.

### 7.2 페이지 헤더

모든 주요 페이지는 `PageHeader`를 사용한다.

예시:

```tsx
<PageHeader>
  <div>
    <PageTitle>교적</PageTitle>
    <PageDescription>교인 정보, 직분, 가족, 출석 상태를 관리합니다.</PageDescription>
  </div>
  <PageActions>
    <Button asChild>
      <Link href="/members/new">교인 등록</Link>
    </Button>
  </PageActions>
</PageHeader>
```

페이지 설명은 필요한 경우에만 넣는다. 모든 페이지에 긴 설명을 넣지 않는다.

### 7.3 모바일

모바일에서는 다음 원칙을 따른다.

- 좌측 사이드바는 접거나 상단 메뉴로 전환한다.
- 테이블은 가로 스크롤 또는 카드형 목록으로 전환한다.
- 필터는 한 줄에 억지로 넣지 않고 세로 배치한다.
- 버튼은 최소 높이 36px 이상, 주요 액션은 40px 이상을 권장한다.
- 공개 사이트의 폼은 모바일 우선으로 설계한다.

---

## 8. 업무 화면 패턴

### 8.1 목록 페이지

목록 페이지 기본 구조:

```txt
PageHeader
FilterBar
Bulk/Primary actions
DataTable
Pagination
```

적용 대상:

- `/members`
- `/finance`
- `/assets`
- `/forms`
- `/site/new-family`
- `/site/offerings`

필터바 규칙:

- `form`은 `FilterBar` 또는 `Toolbar` 컴포넌트로 감싼다.
- 검색 input, select, date range, submit button 순서로 배치한다.
- submit button은 아이콘만 쓰지 말고 텍스트를 유지한다.
- 필터 초기화가 필요한 화면에는 `초기화` 링크/버튼을 둔다.

### 8.2 테이블

`lib/ui/table.tsx`를 만들고 다음 컴포넌트를 제공한다.

```tsx
<Table />
<TableHeader />
<TableBody />
<TableRow />
<TableHead />
<TableCell />
<TableCaption />
```

테이블 지침:

- 헤더는 `text-muted-foreground`와 작은 글꼴을 사용한다.
- row hover는 `hover:bg-muted/60` 수준으로 약하게 준다.
- 행 클릭 가능 영역과 링크는 명확히 구분한다.
- 숫자, 금액은 오른쪽 정렬한다.
- 상태는 텍스트만 두지 말고 `Badge`를 사용한다.
- 빈 값은 `-` 또는 `—` 중 하나로 통일한다. 권장: `—`.

금액 표시:

```tsx
<TableCell className="text-right tabular-nums">{formatWon(amount)}</TableCell>
```

### 8.3 상세 페이지

상세 페이지 기본 구조:

```txt
PageHeader
Summary section
Detail sections
Related lists
Audit/History
```

카드 사용 원칙:

- 섹션을 전부 카드로 감싸지 않는다.
- 반복되는 상세 정보 묶음이나 독립된 도구에만 `Card`를 사용한다.
- 카드 안에 카드 중첩을 피한다.

상세 정보는 `DescriptionList` 또는 `KeyValueList` 컴포넌트를 만든다.

### 8.4 폼

폼 컴포넌트는 `lib/ui/form.tsx`를 확장한다.

제공 컴포넌트:

```tsx
<Field />
<FieldLabel />
<FieldDescription />
<FieldError />
<Input />
<Textarea />
<Select />
```

폼 지침:

- 필수값은 label 옆에 시각적으로 표시한다.
- 서버 액션 실패는 폼 상단의 `Alert` 또는 필드별 `FieldError`로 표시한다.
- 저장/취소 버튼은 폼 하단에 고정 순서로 둔다.
- 삭제 액션은 기본 저장 액션과 시각적으로 분리한다.

권장 버튼 순서:

```txt
[저장] [취소]                         [삭제]
```

### 8.5 상태 화면

모든 데이터 화면은 다음 상태를 갖는다.

- loading
- empty
- error
- forbidden
- success feedback

Server Component 중심 화면에서는 loading skeleton이 필요한 라우트에 `loading.tsx`를 둔다.

권장 컴포넌트:

```tsx
<EmptyState
  title="교인이 없습니다"
  description="첫 교인을 등록하면 교적, 출석, 헌금 내역을 함께 관리할 수 있습니다."
  action={<Button asChild><Link href="/members/new">교인 등록</Link></Button>}
/>
```

---

## 9. 모듈별 적용 지침

### 9.1 대시보드

현재 대시보드의 단순 `Card`는 `StatCard`로 표준화한다.

필요 컴포넌트:

- `StatCard`
- `RecentList`
- `MiniTrend`

지침:

- 숫자 지표는 `tabular-nums`를 사용한다.
- 재정 수입/지출/잔액은 색상만으로 의미를 전달하지 말고 라벨을 명확히 둔다.
- 대시보드는 지나치게 장식하지 않고 다음 행동으로 이동하기 쉽게 만든다.

### 9.2 교적

핵심 화면:

- `/members`
- `/members/[memberId]`
- `/members/new`
- `/members/[memberId]/edit`
- `/members/attendance`
- `/members/stats`
- `/members/org`
- `/members/compliance`

우선 적용:

- 목록 테이블 표준화
- 교인 상태 `Badge`
- 검색/상태 필터 `FilterBar`
- 상세 페이지 `DescriptionList`
- 목양기록/출석/교육 이력 섹션 정리

민감정보 지침:

- 연락처, 주소, 목양기록, 헌금 관련 정보는 접근 권한과 화면 맥락을 명확히 한다.
- 감사/컴플라이언스 화면은 차분하고 오류 없는 데이터 표시를 우선한다.

### 9.3 재정

핵심 화면:

- `/finance`
- `/finance/new`
- `/finance/accounts`
- `/finance/report`
- `/finance/receipts`

우선 적용:

- 금액 오른쪽 정렬
- 수입/지출/잔액 표기 통일
- 날짜 필터 표준화
- 계정과목 select 표준화
- 전표 등록 폼의 필드 그룹화

주의:

- 금액 입력은 `inputMode="numeric"`을 사용한다.
- 부동소수점처럼 보이는 UI를 만들지 않는다.
- 삭제/수정은 위험 액션으로 명확히 표시한다.

### 9.4 비품

핵심 화면:

- `/assets`
- `/assets/[assetId]`
- `/assets/new`
- `/assets/[assetId]/edit`
- `/assets/classification`
- `/assets/audits`
- `/assets/labels`

우선 적용:

- 자산 상태 `Badge`
- QR/라벨 출력 화면은 프린트 스타일 별도 유지
- 전수조사 진행률 컴포넌트
- 위치/분류/상태 필터 정리

### 9.5 홈페이지 관리

핵심 화면:

- `/site`
- `/site/boards/[boardId]`
- `/site/pages/[pageId]`
- `/site/new-family`
- `/site/offerings`

지침:

- 내부 관리자 UI로 콘텐츠 발행 상태를 명확히 보여준다.
- 발행/비공개 상태는 `Badge`로 표시한다.
- 공개 사이트 미리보기 링크를 제공한다.
- 공개 홈페이지용 컴포넌트와 관리자 컴포넌트를 섞지 않는다.

### 9.6 설문/보고

핵심 화면:

- `/forms`
- `/forms/[formId]`
- `/forms/[formId]/assignments`
- `/forms/[formId]/responses`
- `/forms/[formId]/report`
- `/my/forms`

지침:

- 폼 빌더는 질문/필드 단위를 명확한 반복 블록으로 구성한다.
- 배정 상태, 제출 상태, 미제출 상태를 `Badge`로 표현한다.
- CSV/XLSX 내보내기는 다운로드 버튼 그룹으로 정리한다.
- 셀프포털 작성 화면은 내부 관리자보다 더 크고 단순한 입력 UI를 사용한다.

---

## 10. 공개 교회 홈페이지 지침

공개 사이트는 내부 앱과 다르게 보이되 같은 토큰 시스템을 사용한다.

### 10.1 공개 사이트 기본 구조

```txt
PublicHeader
Hero or page title
Main content
Recent posts / CTA
Footer
```

### 10.2 루트 도메인 SaaS 랜딩

루트 도메인에서 보이는 SaaS 랜딩은 다음을 지킨다.

- H1은 서비스명 또는 명확한 카테고리로 둔다.
- 첫 화면에서 가입/온보딩 액션이 명확해야 한다.
- 내부 관리자처럼 보이는 테이블 중심 UI를 쓰지 않는다.
- 과한 마케팅 카피보다 신뢰와 기능 범위를 간결히 보여준다.

### 10.3 교회 서브도메인 공개 사이트

교회별 공개 홈페이지는 다음을 우선한다.

- 교회명
- 예배/공지/게시판
- 새가족 등록
- 온라인 헌금
- 모바일 접근성

공개 사이트 컴포넌트는 `lib/ui/public-site`에 둔다.

---

## 11. 접근성

필수:

- 모든 버튼은 명확한 텍스트 또는 `aria-label`을 가진다.
- 아이콘만 있는 버튼은 `aria-label` 필수.
- Dialog, Dropdown, Select, Tabs는 Radix 기반으로 구현한다.
- focus-visible ring을 제거하지 않는다.
- 색상만으로 상태를 전달하지 않는다.
- form label과 input은 연결한다.
- 에러 메시지는 필드 근처에 둔다.

권장:

- 테이블 caption 또는 페이지 제목으로 데이터 의미를 제공한다.
- 날짜, 금액, 상태는 화면 낭독 시 이해 가능한 텍스트를 유지한다.
- 공개 폼은 모바일 키보드 타입을 고려한다.

---

## 12. 아이콘 정책

아이콘은 `lucide-react`를 사용한다.

예:

```tsx
import { Search, Plus, Download, Printer, Trash2 } from "lucide-react";
```

사용 지침:

- 도구 버튼에는 가능한 아이콘을 함께 사용한다.
- 낯선 아이콘만 단독으로 쓰지 않는다.
- 아이콘 단독 버튼은 `size="icon"`과 `aria-label`을 사용한다.
- 직접 SVG를 새로 그리지 않는다. lucide에 없는 경우만 예외로 한다.

---

## 13. 작업 단계

### Phase D0. 기반 정리

목표: 기존 디자인 토큰과 컴포넌트 기반을 shadcn 스타일로 정리한다.

작업:

- `class-variance-authority`, `@radix-ui/react-slot`, `lucide-react` 추가
- `lib/ui/button.tsx`를 variant 기반으로 개선
- `lib/ui/form.tsx`에 `Field`, `FieldLabel`, `FieldDescription`, `FieldError` 추가
- `lib/ui/card.tsx`, `badge.tsx`, `table.tsx`, `empty-state.tsx`, `skeleton.tsx` 추가
- `app/globals.css`에 필요한 상태 토큰 추가 검토

완료 기준:

- 기존 로그인 화면이 새 `Button`, `Input`으로 정상 동작
- `npm run lint`
- `npm run typecheck`

### Phase D1. AppShell 개선

목표: 내부 앱의 공통 레이아웃을 표준화한다.

작업:

- `app/(app)/app-shell.tsx`를 작은 컴포넌트로 분해
- `lib/ui/app/app-shell.tsx`, `app-header.tsx`, `app-sidebar.tsx` 등으로 이전 검토
- 사이드바 활성 상태, 상단 모듈 nav, 사용자 액션 시각 계층 정리
- 모바일 동작 정의
- `ThemeToggle`을 일관된 form/select 스타일로 정리

완료 기준:

- 기존 권한별 메뉴 필터링 유지
- 현재 경로 active 상태 유지
- 관리자, staff, viewer, member 역할 흐름 깨지지 않음

### Phase D2. 목록/테이블 화면 우선 적용

목표: 가장 많이 쓰는 업무 화면부터 일관화한다.

우선순위:

1. `/members`
2. `/finance`
3. `/assets`
4. `/forms`
5. `/site/new-family`
6. `/site/offerings`

작업:

- `PageHeader`
- `FilterBar`
- `Table`
- `Badge`
- `Pagination`
- `EmptyState`

완료 기준:

- 목록 화면의 필터, 테이블, 빈 상태가 일관됨
- 금액과 숫자 정렬이 일관됨
- 새 코드에서 토큰 외 색상 유틸 사용 없음

### Phase D3. 폼/상세 화면 적용

목표: 등록, 수정, 상세 확인 화면의 사용성을 개선한다.

우선순위:

1. 교인 등록/수정/상세
2. 전표 등록/상세
3. 자산 등록/수정/상세
4. 폼 빌더/응답 상세

작업:

- `Field` 기반 폼 정리
- `DescriptionList` 또는 `KeyValueList` 추가
- 위험 액션 분리
- 서버 액션 에러 표시 표준화

완료 기준:

- 필드 label과 input 연결
- 저장/취소/삭제 액션 위치 통일
- 에러 상태 표시 통일

### Phase D4. 공개 사이트 분리

목표: 공개 교회 홈페이지가 내부 관리자 앱처럼 보이지 않게 한다.

작업:

- `lib/ui/public-site` 컴포넌트 추가
- `app/(public)/site-header.tsx` 정리 또는 이동
- 공개 홈, 게시판, 페이지, 새가족 등록, 온라인 헌금 스타일 통일
- 교회별 `site.theme` 적용 구조 유지

완료 기준:

- 공개 사이트와 내부 앱의 UI 톤이 분리됨
- 공개 폼이 모바일에서 자연스럽게 사용 가능
- 발행 콘텐츠만 노출되는 공개 경계 유지

### Phase D5. 시각 QA와 문서화

목표: 디자인 시스템 적용 후 회귀를 막는다.

작업:

- `AGENTS.md`의 디자인 시스템 규칙 갱신
- `design.md`를 저장소 루트에 추가
- 주요 화면 캡처 갱신
- 색상 금지 규칙을 lint 또는 리뷰 체크리스트에 반영
- 주요 역할별 화면 점검

완료 기준:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- 주요 화면 수동 캡처 또는 Playwright 스크린샷 확인

---

## 14. PR 분할 제안

큰 변경을 한 번에 하지 않는다. 다음 순서로 PR을 나눈다.

### PR 1. UI primitives foundation

범위:

- 의존성 추가
- `lib/ui` 기본 컴포넌트 추가/개선
- 토큰 보완
- 로그인 화면 또는 작은 화면 1개 적용

검증:

```bash
npm run lint
npm run typecheck
```

### PR 2. AppShell and navigation polish

범위:

- 내부 앱 shell 정리
- 사이드바/상단 nav 개선
- 테마 토글 정리

검증:

```bash
npm run lint
npm run typecheck
npm run test
```

### PR 3. Core lists

범위:

- `/members`
- `/finance`
- `/assets`
- 공통 Table/Filter/Pagination 적용

검증:

```bash
npm run lint
npm run typecheck
npm run test
```

### PR 4. Forms and detail pages

범위:

- 등록/수정 폼
- 상세 페이지
- 에러/빈 상태

검증:

```bash
npm run lint
npm run typecheck
npm run test
```

### PR 5. Public site polish

범위:

- 공개 홈페이지 컴포넌트
- 새가족 등록
- 온라인 헌금
- 게시판/페이지

검증:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

---

## 15. 코드 스타일 규칙

### 15.1 Tailwind 클래스

권장 순서:

```txt
layout -> spacing -> size -> border -> background -> text -> state -> responsive
```

예:

```tsx
className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
```

### 15.2 컴포넌트 export

한 파일에서 관련 컴포넌트를 함께 export할 수 있다.

예:

```tsx
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

### 15.3 Server Component 우선

현재 앱은 App Router와 서버 컴포넌트 중심이다.

원칙:

- UI 프리미티브는 client가 필요 없으면 server-compatible로 유지한다.
- Radix interaction이 필요한 컴포넌트만 `"use client"`를 붙인다.
- 페이지 전체를 client component로 바꾸지 않는다.

---

## 16. 금지 사항

다음은 하지 않는다.

- Ant Design/MUI/Mantine로 전체 UI 교체
- 페이지마다 독립적인 버튼/입력 스타일 재작성
- `text-gray-*`, `bg-gray-*`, `border-gray-*` 남발
- 카드 안에 카드 중첩
- 내부 업무 앱에 마케팅 랜딩식 히어로 적용
- 공개 사이트와 관리자 앱 컴포넌트 무분별 혼용
- focus ring 제거
- 아이콘만 있고 label/aria-label 없는 버튼
- 테이블 숫자/금액 왼쪽 정렬
- 삭제 액션을 primary 버튼처럼 표시
- 서버 컴포넌트를 불필요하게 client component로 변경

---

## 17. 검수 체크리스트

작업 완료 전 다음을 확인한다.

### 공통

- [ ] 새 UI는 `lib/ui` 컴포넌트를 우선 사용한다.
- [ ] 토큰 색상만 사용한다.
- [ ] focus-visible 상태가 보인다.
- [ ] 모바일에서 텍스트와 버튼이 겹치지 않는다.
- [ ] empty/error/loading 상태가 있다.
- [ ] 권한 부족 화면과 민감정보 화면이 어색하지 않다.

### 내부 앱

- [ ] AppShell active 상태가 정확하다.
- [ ] 메뉴 권한 필터링이 유지된다.
- [ ] 테이블 헤더, 셀 padding, hover가 통일됐다.
- [ ] 필터와 페이지네이션이 기존 query param을 유지한다.
- [ ] 금액/숫자 정렬이 맞다.

### 공개 사이트

- [ ] 공개 사이트가 내부 관리자처럼 보이지 않는다.
- [ ] 교회별 theme 적용이 유지된다.
- [ ] 게시판/페이지는 발행된 콘텐츠만 보인다.
- [ ] 새가족/헌금 폼이 모바일에서 사용 가능하다.

### 품질 게이트

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`

---

## 18. 작업자에게 전달할 한 줄 지시

이 프로젝트는 `Next.js 16 + Tailwind v4` 기반의 멀티테넌트 교회 관리 SaaS다. Ant Design/MUI로 갈아타지 말고, 현재 `globals.css` 토큰과 `lib/ui` 구조를 살려 shadcn/ui 스타일의 app-owned 디자인 시스템을 확장하라. 내부 관리자 앱은 조용하고 정보 밀도 높은 업무 UI로, 공개 교회 홈페이지는 별도 public-site 컴포넌트로 분리해 구현하라.

