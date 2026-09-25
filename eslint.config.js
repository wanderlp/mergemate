import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["out/**", "dist/**", "node_modules/**", "*.tsbuildinfo"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    files: ["src/main/**/*.ts", "src/preload/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", "window", "document"]
    }
  },
  {
    files: ["scripts/**/*.{js,mjs,ts}"],
    rules: {
      "no-restricted-globals": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
