import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\bgray-\\d/]",
          message:
            "禁止使用 Tailwind gray-* 色阶，请改用 text-muted-foreground、text-foreground、border-border、bg-muted、bg-card 等语义 token。",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateLiteral TemplateElement[value.raw=/\\bgray-\\d/]",
          message:
            "禁止使用 Tailwind gray-* 色阶，请改用 text-muted-foreground、text-foreground、border-border、bg-muted、bg-card 等语义 token。",
        },
      ],
    },
  },
]);

export default eslintConfig;
