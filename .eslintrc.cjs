module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2021: true,
  },

  parser: "@typescript-eslint/parser",

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: [
    "@typescript-eslint",
    "simple-import-sort",
  ],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],

  rules: {
    semi: ["error", "never"],
    indent: ["error", 2],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_" },
    ],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "@typescript-eslint/no-explicit-any": "warn",
  },
}
