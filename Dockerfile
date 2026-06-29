# church-suite 운영 이미지 (스펙 §12). app(next start) + worker(tsx) 공용.
# devDependencies 가 빌드(@tailwindcss/postcss·typescript)와 런타임(tsx 워커·drizzle-kit
# 마이그레이션)에 모두 필요하므로 prune 하지 않는다. NODE_ENV=production 은 런타임에만.
# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
WORKDIR /app
# pnpm 워크스페이스(스펙 §1 P-1). corepack 으로 package.json 의 packageManager 버전 활성화.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json ./
RUN corepack enable

# ── 의존성 설치 ──
# --no-frozen-lockfile: optional 플랫폼 바이너리/lockfile 드리프트에 견고하게(기존 정책과 동일 의도).
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/core/package.json ./packages/core/package.json
RUN pnpm install --no-frozen-lockfile

# ── 빌드 ──
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드는 DB·시크릿 불필요 — 모듈 로드 가드만 충족시키는 placeholder.
ENV APP_DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    JWT_SECRET=build-time-placeholder \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── 런타임 ──
FROM base AS runner
# STORAGE_LOCAL_DIR: 기본 드라이버(local)의 저장 루트(컨테이너 내 경로).
# compose 의 named volume 을 이 경로에 마운트해 영속화/공유한다. s3 사용 시 무시됨.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    STORAGE_LOCAL_DIR=/data/storage
COPY --from=build /app /app
EXPOSE 3000
# 기본 명령은 앱. 워커는 compose 에서 command 로 override(pnpm run worker).
CMD ["pnpm", "run", "start"]
