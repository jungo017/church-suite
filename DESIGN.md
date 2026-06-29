# DESIGN.md — 디자인 시스템 가이드 (초안)

> **상태:** 초안(draft). 일부 항목은 "권장/로드맵"으로, 아직 확정·적용 전입니다.
> **위치:** 운영 문서는 [`AGENTS.md`](./AGENTS.md), 도메인 기준은 [`church-saas-final-spec.md`](./church-saas-final-spec.md). 이 문서는 **UI/디자인 규칙의 단일 기준**입니다.
> **원칙 충돌 시:** 스펙 > AGENTS.md(코딩 규칙) > 이 문서.

이 문서는 church-suite의 **시각 디자인 언어와 컴포넌트 규약**을 정의합니다. 각 절은 다음 둘로 구분합니다.

- 🟢 **현재(canonical)** — 지금 코드에 적용되어 있고, 새 화면이 **반드시 지켜야 하는** 기준.
- 🟡 **권장/로드맵** — 도입을 검토 중인 방향. 아직 미적용. 적용은 별도 결정·PR로.

---

## 0. 디자인 철학

church-suite는 **멀티테넌트 교회 관리 SaaS**입니다. 디자인은 세 종류의 사용자/맥락을 동시에 만족해야 합니다.

1. **관리 대시보드 `(app)`** — 교적·재정·비품·CMS 실무. 정보 밀도가 높고, 표·폼·필터가 핵심. → **차분하고 효율적**, 절제된 장식.
2. **교회 공개 사이트 `(public)`** — 교회별 홈페이지·온라인 교인센터. 교회마다 분위기가 달라야 함. → **교회별(per-tenant) 테마**로 따뜻함/미니멀/모던을 선택.
3. **마케팅 랜딩(루트 도메인)** — 가입 유도. → 신뢰감 + 명료함.

> **핵심 차별점:** 단일 톤이 아니라 **테마 토큰으로 분위기를 통째 교체**하는 구조. 한 교회는 따뜻하게(warm), 다른 교회는 미니멀하게(minimal) 보일 수 있어야 한다. 이 요구가 디자인 시스템 전체 구조를 결정한다.

**1인 개발 친화 우선** — 의존성과 유지보수 부담을 최소화한다. 화려함보다 **일관성**.

---

## 1. 토큰 구조 🟢

색상은 **CSS 변수**로 정의하고, **`data-theme` 속성으로 테마를 통째 교체**한다. 컴포넌트는 항상 의미 토큰(`bg-primary`, `text-foreground` …)만 참조하고, **하드코딩 색(`#hex`, `text-gray-*`)을 쓰지 않는다.**

- 정의 위치: [`app/globals.css`](./app/globals.css)
- Tailwind v4 `@theme inline`으로 CSS 변수 → Tailwind 색 유틸로 노출.
- 기본 테마(`:root`) = `modern`.

### 1.1 의미 토큰 목록

| 토큰 | 용도 |
|---|---|
| `background` / `foreground` | 페이지 바탕 / 기본 텍스트 |
| `card` / `card-foreground` | 카드·패널 면 / 그 위 텍스트 |
| `muted` / `muted-foreground` | 약한 배경(구분·비활성) / 보조 텍스트 |
| `border` / `input` | 구분선·테두리 / 폼 컨트롤 테두리 |
| `primary` / `primary-foreground` | 주요 액션(CTA·활성) / 그 위 텍스트 |
| `accent` / `accent-foreground` | 강조 배경(배지·하이라이트) / 그 위 텍스트 |
| `destructive` | 파괴적 액션·오류(삭제·실패) |
| `ring` | 포커스 링 |
| `radius` | 기준 모서리 반경(→ `radius-sm/md/lg` 파생) |

### 1.2 테마별 토큰값 (현행)

| 토큰 | modern(기본) | warm | minimal | dark |
|---|---|---|---|---|
| `background` | `#ffffff` | `#faf7f2` | `#ffffff` | `#0b0f17` |
| `foreground` | `#0f172a` | `#3f3a34` | `#111111` | `#e5e7eb` |
| `card` | `#ffffff` | `#ffffff` | `#ffffff` | `#131a26` |
| `muted` | `#f1f5f9` | `#f0ebe3` | `#f5f5f5` | `#1f2937` |
| `muted-foreground` | `#64748b` | `#8a8178` | `#6b7280` | `#9ca3af` |
| `border` / `input` | `#e2e8f0` | `#e7ded2` | `#e5e5e5` | `#243044` |
| `primary` | `#4f46e5` | `#6b8e6b` | `#111111` | `#6366f1` |
| `accent` | `#eef2ff` | `#eef3ee` | `#f5f5f5` | `#1e293b` |
| `destructive` | `#dc2626` | `#b4543a` | `#b91c1c` | `#ef4444` |
| `ring` | `#6366f1` | `#6b8e6b` | `#111111` | `#6366f1` |
| `radius` | `0.5rem` | `0.75rem` | `0.375rem` | `0.5rem` |

> **테마 성격:** `modern`=인디고 기반 SaaS 기본 / `warm`=세이지그린·아이보리, 둥근 모서리(교회 친화) / `minimal`=흑백 고대비 / `dark`=야간.

### 1.3 의미 색(semantic) — 의도적 고정 🟢

아래 색은 **테마와 무관하게 의미가 고정**된다(가독성·관습 우선). 토큰화하지 않고 Tailwind 팔레트를 직접 쓰되, **반드시 아래 규칙대로**만 사용한다.

| 의미 | 색 | 사용처 |
|---|---|---|
| 수입(income) | **blue** | 재정 전표 수입, 잔액 증가 |
| 지출(expense)/파괴 | **destructive(red)** | 재정 지출, 삭제·실패 |
| 성공/정상/활성 | **green** | 출석 완료, 활성 교인, 승인 |
| 경고/대기 | **amber** | 승인 대기, 마감 임박, 미제출 |
| 정보/중립 | **muted / accent** | 일반 안내, 비활성 |

---

## 2. 멀티테마 & 교회별 테마 🟢

테마 교체는 **`data-theme` 속성**으로 이뤄진다. 두 경로가 있다.

### 2.1 관리 앱 `(app)` — 사용자 개인 설정
- 사이드바 테마 토글 → `localStorage`에 저장, `useSyncExternalStore`로 구독.
- 첫 페인트 전 인라인 스크립트가 `document.documentElement.dataset.theme` 적용 → **플래시(FOUC) 방지** (`app/layout.tsx`).

### 2.2 공개 사이트 `(public)` — 교회별 설정
- `site.theme` 값을 공개 래퍼 `<div data-theme>`에 적용(`getPublicSiteTheme`).
- 교회 운영자가 `/site`에서 선택. **교회마다 다른 테마**로 렌더.

> **규칙:** 테마는 토큰 교체만으로 완성되어야 한다. 컴포넌트에 테마 분기(`if theme === 'warm'`) 로직을 넣지 말 것 — 새 테마는 `globals.css`에 토큰 블록 하나만 추가하면 동작해야 한다.

🟡 **권장:** shadcn 다크모드는 `.dark` 클래스를 쓰지만 우리는 `data-theme="dark"`. 향후 shadcn 컴포넌트 도입 시 Tailwind v4 `@custom-variant dark (&:where([data-theme="dark"] *))`로 셀렉터만 맞춘다.

---

## 3. 타이포그래피

### 3.1 폰트 🟢
- **본문/UI:** Pretendard Variable (한글) — `--font-sans` 토큰.
  - 폴백: `Pretendard, system-ui, -apple-system, sans-serif`
  - 로드: `app/layout.tsx`의 CDN `<link>` (jsdelivr, v1.3.9, dynamic-subset)

### 3.2 타입 스케일 🟢 (Tailwind 기본, 4px 그리드)
| 용도 | 클래스 | 크기 |
|---|---|---|
| 배지·캡션 | `text-xs` | 12px |
| 본문·표·폼 | `text-sm` | 14px |
| 일반 텍스트 | `text-base` | 16px |
| 소제목 | `text-lg` / `text-xl` | 18 / 20px |
| 페이지 제목 | `text-2xl` | 24px |

- 본문/표/라벨은 **`text-sm`(14px)** 를 기본으로 한다(대시보드 밀도).
- 강조 위계는 **굵기(font-medium/semibold)** 로, 색은 `foreground`↔`muted-foreground`로 표현.

### 3.3 숫자 표기 🟡 권장
재정 모듈의 금액은 자릿수 정렬이 중요하다. 두 방안 중 택1:
- **간단:** 금액·수치에 `tabular-nums`(`font-variant-numeric`) 적용.
- **명확:** certkeeper처럼 **JetBrains Mono**를 `--font-mono`로 추가해 금액·QR코드·태그 표기에 사용.

---

## 4. 컴포넌트

### 4.1 현재 프리미티브 🟢 — [`lib/ui/`](./lib/ui)

모든 컴포넌트는 `cn()`([`lib/utils.ts`](./lib/utils.ts), clsx + tailwind-merge)로 클래스를 병합한다.

| 컴포넌트 | API | 비고 |
|---|---|---|
| **Button** (`button.tsx`) | `variant`: `primary`·`outline`·`ghost`·`destructive` / `size`: `sm`·`md` | `buttonClass()`로 `<Link>`에도 버튼 스타일 적용 가능 |
| **Card** (`card.tsx`) | `<div>` 래퍼 | `rounded-lg border bg-card` |
| **Badge** (`badge.tsx`) | `tone`: `default`·`success`·`warning`·`muted` | 상태 표시 |
| **Form** (`form.tsx`) | `Input`·`Textarea`·`Select`·`Label` + `controlClass` | 토큰 기반 폼 컨트롤 |

### 4.2 컴포넌트 사용 규칙 🟢 (AGENTS.md §2 강제 규칙)

1. **새 화면은 `lib/ui` 프리미티브 + 토큰 색만 사용.**
   허용: `bg-background`/`foreground`/`card`/`muted`/`border`/`primary`/`destructive` 등 토큰.
2. **금지:** `text-gray-*`, `border-black/*`, 임의 `#hex`, 인라인 색상.
3. 의미 색(§1.3)은 정해진 의미로만. (수입=blue, 성공=green, 경고=amber …)
4. 반복되는 Tailwind 문자열은 프리미티브/공통 클래스로 추출 — JSX에 긴 클래스 문자열 복붙 금지.

### 4.3 권장 확장 🟡 로드맵 — shadcn/ui (additive, 교체 아님)

현재 프리미티브에는 **Dialog·Dropdown·Select(검색형)·Tabs·Toast·Tooltip·Popover** 등 상호작용/접근성 컴포넌트가 없다. 직접 구현(a11y·포커스 트랩 포함)은 1인 개발에 부담.

- **방향:** [shadcn/ui](https://ui.shadcn.com) 컴포넌트를 **`lib/ui`에 복사해 흡수**(설치형 의존성 아님 → lock-in 없음).
- **호환성:** 우리 토큰명(`--background`·`--primary`·`--card`·`--muted`·`--destructive`·`--ring`·`--radius`)이 shadcn 규약과 **약 90% 일치** → 거의 드롭인. 보완 필요 토큰: `--popover`/`--popover-foreground`, `--secondary`/`--secondary-foreground`, `--destructive-foreground`.
- **전제 유지:** Next.js 16 / React 19 / Tailwind v4 / 기존 토큰·테마 **그대로**. 기존 `lib/ui` 4종은 **삭제하지 않고 점진 흡수**. 빅뱅 마이그레이션 아님.
- **아이콘:** `lucide-react` 도입(현재 아이콘 라이브러리 없음).

---

## 5. 상태색 단일출처 패턴 🟡 권장 (certkeeper 이식)

교회 도메인은 상태가 많다(교인 상태·출석·헌금·승인 대기·새가족·설문 제출…). 화면마다 색을 직접 정하면 일관성이 깨진다.

**원칙:** 상태→색 매핑을 **한 곳에서만** 결정한다. certkeeper의 `status-badge` fragment를 React 컴포넌트로 옮긴다.

```
// 예시 방향 — lib/ui/status-badge.tsx
// 도메인 상태 enum → Badge tone 매핑을 단일 출처로.
// 화면에서는 <StatusBadge kind="member" value={status} /> 만 호출.
```

| 도메인 의미 | Badge tone / 색 |
|---|---|
| 활성·정상·완료(출석 O, 승인됨) | `success`(green) |
| 대기·임박·미제출(승인 대기, 미제출) | `warning`(amber) |
| 실패·만료·삭제 | `destructive`(red) |
| 비활성·미확인·중립 | `muted` |
| 일반 정보·기본 | `default`(accent) |

> 정확한 enum 값은 각 모듈 `lib/*/constants.ts`에 있다. 매핑 컴포넌트는 그 enum을 import해 색을 결정하고, **색은 이 컴포넌트 밖으로 새지 않는다.**

🟡 필요 시 Badge에 `info`(sky)·`danger`(red) tone 추가 검토.

---

## 6. 레이아웃 패턴 🟢

- **`(app)` 인증 영역:** `AppShell`(사이드바 + 콘텐츠). 정보구조 = 상위 시스템(교적/재정/비품/홈페이지) → 하위 기능. 각 시스템은 자기 사이드바를 가진 독립 작업공간.
- **`(public)` 공개 영역:** `site-header` + 교회별 테마 래퍼. **민감 테이블 직접 접근 금지**(발행 콘텐츠/intake만).
- **경계는 구조로 강제:** 라우트 그룹 `(app)` / `(public)`로 공개/인증을 분리(AGENTS.md §6).
- 권한별 네비 필터: 사이드바 항목은 RBAC 권한으로 노출 제어.

🟡 **권장 공통 조각**(certkeeper fragment 대응): `PageHeader`(제목+액션), `FilterBar`, `EmptyState`, `Pagination`(이미 페이지네이션 유틸 존재), `DetailSection`. 반복 레이아웃을 컴포넌트화.

---

## 7. 접근성 🟢/🟡

- 🟢 포커스 가시성: 모든 인터랙티브 요소에 `focus-visible:ring-2 focus-visible:ring-ring`(프리미티브에 적용됨).
- 🟢 폼: `Label`로 연결, 비활성은 `disabled:opacity-50`.
- 🟡 대비: 각 테마 토큰 조합은 WCAG AA(본문 4.5:1) 충족을 목표. 새 테마 추가 시 대비 점검.
- 🟡 shadcn 도입 시 Radix 기반으로 키보드·ARIA·포커스 트랩 확보.

---

## 8. 변경·검수 체크리스트

새 화면/컴포넌트 PR 시:

- [ ] `lib/ui` 프리미티브 사용, 토큰 색만 사용(§4.2).
- [ ] `text-gray-*`·임의 `#hex`·인라인 색 **없음**.
- [ ] 의미 색(§1.3) 규칙 준수(수입=blue 등).
- [ ] 상태 표시는 단일출처 매핑 경유(§5, 도입 후).
- [ ] 4개 테마(modern/warm/minimal/dark)에서 깨지지 않음.
- [ ] 공개 영역이면 교회별 테마 래퍼 안에서 정상 렌더.
- [ ] 포커스 가시성·라벨 연결 확인.
- [ ] `npm run lint` / `typecheck` 통과.

---

## 9. 로드맵 / 미결정 🟡

| 항목 | 상태 | 비고 |
|---|---|---|
| shadcn/ui 컴포넌트 흡수 | **미결정** | additive, 토큰 호환. §4.3 |
| lucide-react 아이콘 | **미결정** | 현재 아이콘 라이브러리 없음 |
| 상태색 단일출처 `StatusBadge` | **권장** | §5 |
| 금액 `tabular-nums` / JetBrains Mono | **권장** | 재정 모듈. §3.3 |
| 폰트 CDN → `next/font` 전환 | **검토** | LCP·FOUC 개선 |
| 보완 토큰(`popover`/`secondary` 등) | **shadcn 도입 시** | §4.3 |
| 공통 레이아웃 조각(`PageHeader` 등) | **권장** | §6 |

---

## 10. 참고

- [`AGENTS.md`](./AGENTS.md) — 운영 지침·코딩 규칙(디자인 규칙 원문 §2).
- [`church-saas-final-spec.md`](./church-saas-final-spec.md) — 도메인·아키텍처 단일 기준.
- [`app/globals.css`](./app/globals.css) — 토큰 정의(단일 출처).
- [`lib/ui/`](./lib/ui) — 프리미티브.
- 설치된 디자인 스킬: `frontend-design`(Anthropic), `ui-ux-pro-max`(팔레트·타이포·UX DB) — 화면 디자인 구체화 시 활용.
