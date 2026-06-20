import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다. .env 를 확인하세요.");
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
 * 기본 DB 핸들.
 *
 * ⚠️ 주의: 이 핸들은 RLS 세션 변수(app.church_id)를 설정하지 않습니다.
 * 테넌트 데이터 접근은 Phase 0.3 에서 추가될 테넌트 스코프 래퍼를 통해야 합니다
 * (불변 규칙, AGENTS.md §4: 모든 DB 접근은 RLS 경유).
 */
export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
