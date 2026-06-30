import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit 설정 — generate / migrate / studio 가 이 파일을 읽습니다.
// 스키마는 모듈별 파일로 분리하고 packages/core/src/db/schema/index.ts 에서 재노출합니다(M1.5).
export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/core/src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // TS는 camelCase, DB는 snake_case 로 자동 매핑 (church_id 등).
  casing: "snake_case",
  verbose: true,
  strict: true,
});
