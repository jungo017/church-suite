# church-suite 운영 이미지 (스펙 §12). app(next start) + worker(tsx) 공용.
# devDependencies 가 빌드(@tailwindcss/postcss·typescript)와 런타임(tsx 워커·drizzle-kit
# 마이그레이션)에 모두 필요하므로 prune 하지 않는다. NODE_ENV=production 은 런타임에만.
# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
WORKDIR /app

# ── 의존성 설치 ──
# npm ci 대신 npm install — esbuild(tsx)의 플랫폼별 optional 바이너리가
# lockfile 과 엄격 비교 시 깨지는 알려진 이슈 회피(.github/workflows/ci.yml 과 동일).
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# ── 빌드 ──
FROM base AS build
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드는 DB·시크릿 불필요 — 모듈 로드 가드만 충족시키는 placeholder.
ENV APP_DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    JWT_SECRET=build-time-placeholder \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 런타임 ──
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app /app
EXPOSE 3000
# 기본 명령은 앱. 워커는 compose 에서 command 로 override(npm run worker).
CMD ["npm", "run", "start"]
