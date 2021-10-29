module.exports = {
  // "parser":"babel-eslint"
  settings: {
    react: { version: 'detect' },
  },
  env: {
    es2020: true,
    node: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  // plugin:@typescript-eslint/recommended
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  rules: { 'react/prop-types': 0 },
};
