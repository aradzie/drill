import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import ts from "typescript-eslint";
import custom from "./eslint-plugin-custom.js";

export default defineConfig([
  globalIgnores(["app/**", "**/tmp/", "**/dist/"]),
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    extends: [js.configs.recommended, ts.configs.recommended],
    plugins: { custom, "simple-import-sort": simpleImportSort },
    rules: {
      "eqeqeq": ["error", "always", { null: "never" }],
      "prefer-const": "off",
      "no-constant-condition": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-inferrable-types": ["error", { ignoreParameters: true, ignoreProperties: true }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            [
              "^\\u0000",
              "^node:",
              "^@?\\w",
              "^(?!.*\\.module\\.css$)",
              "^\\.(?!.*\\.module\\.css$)",
              "\\.module\\.css$",
            ],
          ],
        },
      ],
      "simple-import-sort/exports": ["error"],
      "custom/check-import-path": "error",
    },
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
    },
  },
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
    plugins: { custom },
    rules: {
      "custom/no-try-finally": "error",
    },
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
    },
  },
]);
