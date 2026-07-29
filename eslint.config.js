const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = tseslint.config(
  // Exclude compiled output — these are generated files, not source
  { ignores: ['bin/**'] },

  ...tseslint.configs.recommended,

  // TypeScript source files
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['warn', 'single'],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Plain JS files (CJS scripts, config) legitimately use require()
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
