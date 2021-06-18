module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'signed-off-by': [2, 'always', 'Signed-off-by:'],
  },
};
