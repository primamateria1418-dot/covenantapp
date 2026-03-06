module.exports = {
  root: true,
  extends: ['eslint-config-expo'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
    },
  ],
  ignorePatterns: ['dist/**', 'node_modules/**', '.expo/**'],
};
