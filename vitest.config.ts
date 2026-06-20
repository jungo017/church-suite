import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// 루트 절대경로(끝에 / 포함).
const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // "@/..." → 프로젝트 루트
      { find: /^@\/(.*)$/, replacement: `${root}$1` },
      // "server-only" 가드는 테스트(Node)에서 빈 모듈로 대체
      { find: /^server-only$/, replacement: `${root}test/stubs/empty.ts` },
    ],
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    // DB 를 공유하므로 파일 간 병렬 실행 비활성(레이스 방지). 파일 내부는 순차.
    fileParallelism: false,
    include: ["test/**/*.test.ts"],
  },
});
