import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Code quality
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "warn",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "object-shorthand": "error",

      // Async/await
      "no-return-await": "error",
      "require-await": "warn",

      // Style
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-trailing-spaces": "error",
      semi: ["error", "always"],
      quotes: ["error", "single", { avoidEscape: true }],
    },
  },
  {
    // Relax rules in scripts
    files: ["scripts/**/*.js"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["node_modules/**", "coverage/**", "*.min.js"],
  },
];
