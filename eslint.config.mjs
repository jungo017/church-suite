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
  // 디자인 토큰 강제(DESIGNE.md §5.3·§16): UI 소스(.tsx)에서 원시 Tailwind 색상
  // 스케일·black/white 금지. 토큰 색(bg-background/foreground/card/muted/border/primary/
  // destructive/success/warning/info …)만 사용. 정당한 예외(프린트 QR 라벨·차트)는
  // eslint-disable 로 명시한다.
  {
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/(text|bg|border|ring|divide|from|via|to|fill|stroke)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]",
          message:
            "원시 색상 스케일 금지(DESIGNE.md §5.3). 토큰 색(text-primary/success/warning/info/destructive/muted-foreground 등)을 사용하세요.",
        },
        {
          selector:
            "TemplateElement[value.raw=/(text|bg|border|ring|divide|from|via|to|fill|stroke)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]",
          message:
            "원시 색상 스케일 금지(DESIGNE.md §5.3). 토큰 색을 사용하세요.",
        },
        {
          selector: "Literal[value=/(text|bg|border)-(black|white)/]",
          message:
            "text/bg/border-black|white 금지(DESIGNE.md §5.3). 토큰 색을 사용하세요.",
        },
        {
          selector: "TemplateElement[value.raw=/(text|bg|border)-(black|white)/]",
          message:
            "text/bg/border-black|white 금지(DESIGNE.md §5.3). 토큰 색을 사용하세요.",
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
