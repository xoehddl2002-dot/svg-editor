module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@tanstack/eslint-plugin-query/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs','src/features/editor/svgcanvas','src/features/editor/color-picker'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh','@tanstack/query',  "react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "warn", // Checks effect dependencies
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/no-rest-destructuring": "warn",
    "@tanstack/query/stable-query-client": "error"
  },
}
