import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// 앱 런타임은 비슈퍼유저 롤(church_app)로 접속해야 RLS 가 적용된다(스펙 §5).
// APP_DATABASE_URL 미설정 시 슈퍼유저로 떨어지면 RLS 가 무력화되므로 명시적으로 요구한다.
const connectionString = process.env.APP_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "APP_DATABASE_URL 환경 변수가 설정되지 않았습니다(앱 런타임 비슈퍼유저 롤). .env 를 확인하세요.",
  );
}

// 개발 중 HMR 로 커넥션이 누적되지 않도록 전역에 클라이언트를 재사용합니다.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

// prepare:false — PgBouncer(transaction pooling) 호환 (스펙 §12).
const client =
  globalForDb.client ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

/**
 * 기본 DB 핸들 (church_app 롤, RLS 적용 대상).
 *
 * ⚠️ 이 핸들로 직접 쿼리하면 app.church_id 가 설정되지 않아 0행/INSERT 차단된다(안전망).
 * 테넌트 데이터 접근은 반드시 `lib/db/tenant` 의 withTenant / withSystem 래퍼를 거친다
 * (불변 규칙, AGENTS.md §4: 모든 DB 접근은 RLS 경유).
 */
export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
