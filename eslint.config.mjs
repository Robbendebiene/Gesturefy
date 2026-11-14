import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";

export default [
  {
    ignores: ["node_modules/**", "src/core/bundle/**"],
  },

  // Extension source files (background, content scripts, popup, options)
  {
    files: ["**/*.js", "**/*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Provides `browser` and `chrome` globals
        ...globals.webextensions,
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      "eqeqeq": ["error", "always"],
      // Possible problems
      "array-callback-return": "error",
      // exclude vars starting with an underscore
      "no-unused-vars": ["error", { "args": "none" }],
      "no-constructor-return": "error",
      "no-duplicate-imports": "error",
      "no-inner-declarations": "error",
      "no-promise-executor-return": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unmodified-loop-condition": "error",
      "no-unreachable-loop": "error",
      "no-use-before-define": ["error", {
        "functions": false,
        "classes": false,
        "variables": true
      }],
      "require-atomic-updates": "error",

      // Best practices
      "prefer-const": "error",
      "guard-for-in": "error",
      "no-console": "warn",
      "no-useless-return": "error",
      "no-param-reassign": ["error", { props: false }],
      "no-nested-ternary": "error",
      "no-lonely-if": "error",
      "no-unneeded-ternary": "error",
      "no-eval": "error",
      "no-alert": "error",
      "no-script-url": "error",
      "no-throw-literal": "error",
      "no-extend-native": "error",
      "no-loop-func": "error",
      "no-multi-assign": "error",
      "no-useless-concat": "error",
      "no-useless-call": "error",
      "no-useless-computed-key": "error",
      "no-useless-rename": "error",
      "no-useless-constructor": "error",
      "no-new-wrappers": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["..", "../**"],
              message:
                "Relative parent imports are not allowed. Use an absolute import starting with / instead (./ is fine).",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "event", message: "Use the event parameter of your handler instead." },
        { name: "name", message: "Did you mean a local variable? Use window.name explicitly." },
        { name: "length", message: "Did you mean a local variable? Use window.length explicitly." },
        { name: "status", message: "Did you mean a local variable? Use window.status explicitly." },
        { name: "parent", message: "Use window.parent explicitly." },
        { name: "top", message: "Use window.top explicitly." },
      ],
      "no-void": "error",
      "symbol-description": "error",
      "consistent-return": "error",
      "block-scoped-var": "error",
      "camelcase": ["error", { properties: "never" }],
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-regex-literals": "error",
      "default-param-last": "error",
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "sort-imports": "error",
      "yoda": "error",
    },
  },

  // JSON files (manifest.json, package.json, _locales, etc.)
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    plugins: {
      json,
    },
    language: "json/json",
    ...json.configs.recommended,
  },
];
