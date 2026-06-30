import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `_` 접두 인자/변수는 의도된 미사용으로 간주(placeholder 시그니처 등).
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // 모듈 플랫폼 경계 강제 (module-platform.md §9, AGENTS §4.1).
  // 패키지(@church/core·@church/module-*)는 ① 앱(@/*)을 역참조할 수 없고,
  // ② 다른 모듈(@church/module-*)을 직접 import 할 수 없다(코어→모듈·모듈→모듈 금지).
  // 통합은 항상 @church/core 의 계약/읽기를 경유한다. 모듈 내부 참조는 상대경로.
  // (호스트 lib/ ·app/ 은 packages/** 가 아니므로 모듈 import 가능 — 셸 합성.)
  {
    files: ["packages/**/*.ts", "packages/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*"],
              message:
                "패키지는 앱(@/*)을 역참조할 수 없습니다 — 통합은 @church/core 경유(module-platform.md §9).",
            },
            {
              group: ["@church/module-*", "@church/module-*/**"],
              message:
                "모듈→모듈/코어→모듈 직접 결합 금지 — @church/core 의 계약/읽기 경유, 모듈 내부는 상대경로(§9).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
