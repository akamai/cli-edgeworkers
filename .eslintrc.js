module.exports = {
  "env": {
    "es6": true,
    "es2021": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "semi": ["error", "always"],
    "quotes": ["warn", "single"],
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-unused-vars": ["warn", {"argsIgnorePattern": "^_"}],
    "@typescript-eslint/no-unused-expressions": "warn",
    "@typescript-eslint/no-explicit-any": "off"
  }
};
