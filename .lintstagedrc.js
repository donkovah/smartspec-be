module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
    'eslint --fix',
    // 'jest --bail --findRelatedTests',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
