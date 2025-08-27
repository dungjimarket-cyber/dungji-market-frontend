import { fileURLToPath } from "url";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    plugins: {
      "unused-imports": unusedImports,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parser: (await import("@typescript-eslint/parser")).default,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    settings: {
      next: {
        rootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
    rules: {
      // 사용하지 않는 import 경고 대신 off로 설정
      "unused-imports/no-unused-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "off",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@next/next/no-html-link-for-pages": "error",
    },
  },
];