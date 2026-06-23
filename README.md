# church-suite

여러 교회가 함께 쓰는 **멀티테넌트 교회 관리 SaaS**. 모듈: 비품(자산) · 교적 · 재정 · 홈페이지(CMS)+온라인교인센터 · 설문/보고.

## 스택

nginx · **Next.js 16**(App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · **Drizzle ORM**(postgres.js) · **PostgreSQL 16** · pg-boss(백그라운드 잡)

## 주요 모듈

- **비품(자산):** 등록·분류·수리이력·QR 라벨·전수조사
- **교적:** 교인·가족·출석·목양기록·교육·통계·직분/연도별 조직 편성·셀프포털
- **재정:** 단식부기 전표·예결산 보고·기부금영수증
- **홈페이지(CMS):** 공개 사이트·게시판·새가족 접수·온라인 헌금
- **설문/보고:** 폼 빌더·역할기반 자동배정·집계(CSV/xlsx)·셀프 제출
- **공통:** 자체 JWT 인증 · RBAC · 멀티테넌시(RLS) · 알림(SMS/알림톡) · 저장소 어댑터(local/S3) · PIPA 컴플라이언스

## 빠른 시작

```bash
cp .env.example .env     # 로컬 기본값으로 충분
npm install
npm run db:up            # Postgres 16 (docker compose)
npm run db:migrate       # 마이그레이션 적용
npm run dev              # http://localhost:3000
```

백그라운드 잡 워커: `npm run worker`

## 명령어

| 구분 | 명령 |
|---|---|
| 개발/빌드 | `npm run dev` · `npm run build` · `npm run start` |
| DB | `npm run db:generate` · `db:migrate` · `db:studio` · `db:up`/`db:down` |
| 품질 게이트 | `npm run lint` · `npm run typecheck` · `npm run test` |

## 멀티테넌시 (중요)

- 모든 테넌트 테이블에 `church_id` + **RLS**. 역할별 접근은 앱 레벨 RBAC 가드로 강제.
- DB 접속 2종: `DATABASE_URL`=슈퍼유저(마이그레이션) / `APP_DATABASE_URL`=앱 런타임(비슈퍼유저 — RLS 적용). **앱은 반드시 후자로 접속.**
- 테넌트는 **서브도메인=교회코드**로 해석.

## 테스트

멀티테넌트 격리·권한·공개 경계를 테스트로 증명. 현재 **92 tests**(+1 skipped: 실 S3 라운드트립). 실행에는 Postgres 가 필요(`npm run test`).

## 배포

Docker 운영 스택(nginx·app·worker·postgres, S3/PgBouncer 확장 프로파일)은 **[`deploy/README.md`](./deploy/README.md)** 참고.

## 문서

- **[`AGENTS.md`](./AGENTS.md)** — 작업 지침: 빌드 순서·불변 코딩 규칙·명령어·현재 상태.
- **[`church-saas-final-spec.md`](./church-saas-final-spec.md)** — 단일 기준 문서(도메인·아키텍처·ERD·로드맵). 충돌 시 항상 우선.
- **[`module-survey-report.md`](./module-survey-report.md)** — 설문·보고 모듈 설계.
