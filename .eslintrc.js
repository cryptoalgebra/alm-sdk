module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['airbnb-base', 'prettier', 'plugin:import/typescript'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        'endOfLine': 'auto',
      }
    ],
    'no-console': ['off'],
    'no-useless-constructor': ['off'],
    '@typescript-eslint/no-useless-constructor': ['error'],
    'no-unused-vars': ['off'],
    '@typescript-eslint/no-unused-vars': ['error'],
    'no-empty-function': ['off'],
    '@typescript-eslint/no-empty-function': ['error'],
    'no-else-return': ['off'],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false,
        optionalDependencies: false,
        peerDependencies: false,
        packageDir: './',
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
      },
    ],
  },
};
