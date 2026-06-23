# 배포 (Docker)

church-suite 운영 스택. 스펙 §12 구성: **nginx + 무상태 Next 인스턴스 + (PgBouncer) + 워커 + 공용 스토리지**.
초기엔 단일 인스턴스 + 단일 Postgres로 단순하게 시작하고, 무상태 원칙을 지킨 채 확장한다.

## 구성 요소

| 서비스 | 역할 | 비고 |
|---|---|---|
| `nginx` | TLS 종료·정적 캐시·서브도메인 라우팅 | `nginx/church-suite.conf` |
| `app` | Next 16 SSR(`next start`, :3000) | 무상태 — 수평 확장 가능 |
| `worker` | 백그라운드 잡(`tsx jobs/worker.ts`, pg-boss) | 알림 송출·미제출 독려 등 |
| `postgres` | 단일 진실 원본(RLS·numeric) | 마이그레이션/잡은 여기로 직접 |
| `pgbouncer` | 커넥션 풀러(transaction) | **profile `scale`**(다중 인스턴스 시) |
| `seaweedfs` | S3 호환 공용 스토리지 | **profile `storage`**(다중 인스턴스면 필수) |

`app`/`worker`는 동일 이미지(`church-suite:latest`)를 공유한다.

## 빠른 시작

```bash
cp deploy/.env.prod.example deploy/.env.prod    # 값 채우기(비밀번호·JWT_SECRET·도메인)

cd deploy
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

$COMPOSE build
$COMPOSE run --rm app npm run db:migrate         # 최초 1회(+스키마 변경 시) 마이그레이션
$COMPOSE up -d
$COMPOSE logs -f app worker
```

브라우저: `http://<교회코드>.<NEXT_PUBLIC_ROOT_DOMAIN>` (예: `cityhope.example.com`). 루트 도메인은 마케팅/가입(`/onboard`).

> 마이그레이션은 슈퍼유저(`DATABASE_URL`)로 실행된다. `drizzle-kit`은 런타임 이미지에 포함되어 있어 `run --rm app` 으로 수행한다.

## 보안 필수 체크

- `JWT_SECRET` — 길고 랜덤하게(`openssl rand -hex 32`).
- `POSTGRES_PASSWORD` — 변경.
- **`church_app` 비밀번호 회전** — 마이그레이션 0003 이 `church_app` 롤을 기본 비밀번호 `'church_app'` 로 생성한다. 배포 후 즉시 회전:
  ```bash
  $COMPOSE exec postgres psql -U church -d church_suite -c "ALTER ROLE church_app PASSWORD '<강한 비밀번호>';"
  ```
  그리고 `.env.prod` 의 `APP_DATABASE_URL`(필요 시 `APP_DB_PASSWORD`)을 갱신 후 `app`/`worker` 재시작.

## TLS (HTTPS)

초기엔 **서브도메인 + 와일드카드 인증서**로 단순화(스펙 §12). 인증서를 `deploy/nginx/certs/`(`fullchain.pem`·`privkey.pem`)에 두고:
1. `docker-compose.prod.yml` 의 nginx `443` 포트와 `certs` 마운트 주석 해제.
2. `nginx/church-suite.conf` 의 HTTPS 서버 블록(주석) 활성화 + `server_name` 을 실제 도메인으로.
3. (선택) HTTP→HTTPS 301 리다이렉트.

커스텀 도메인/자동 갱신은 certbot(DNS-01 와일드카드) 또는 별도 ACME 컨테이너로 이후 자동화.

## 스토리지

- 단일 인스턴스: `STORAGE_DRIVER=local`(컨테이너 디스크)로 충분. 저장 루트는 `STORAGE_LOCAL_DIR`(필수, 이미지 기본 `/data/storage`)이며 compose 의 `appstorage` 볼륨이 그 경로에 마운트되어 영속화·app/worker 공유된다.
- **다중 인스턴스: 로컬 디스크는 공유되지 않으므로 `s3` 필수.**
  ```bash
  $COMPOSE --profile storage up -d seaweedfs
  # .env.prod: STORAGE_DRIVER=s3, STORAGE_ENDPOINT=http://seaweedfs:8333, STORAGE_BUCKET=church-suite ...
  ```

## 수평 확장

1. `.env.prod`: `APP_DATABASE_URL` 을 `pgbouncer:6432` 로 변경(커넥션 고갈 방지).
2. PgBouncer 기동: `$COMPOSE --profile scale up -d pgbouncer`.
3. 앱 인스턴스 늘리기: `$COMPOSE up -d --scale app=3` + `nginx/church-suite.conf` upstream 에 인스턴스 추가(또는 compose 의 동적 이름 사용).
4. 스토리지는 `s3`(공용)로.

> 무상태 원칙(세션=JWT/DB, 파일=S3, 잡=pg-boss)을 지키므로 인스턴스 수만 늘리면 된다. pg-boss/마이그레이션은 PgBouncer를 거치지 않고 Postgres 에 직접 접속한다(세션 기능 필요).

## 백업

자체 호스팅 시 Postgres 복제 + 오프사이트 백업, 스토리지 복제는 대체 불가 데이터라 필수(스펙 §12).
