const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    rules: {
      // Demoted from error to warning: codebase pre-dates these strict React 19
      // rules. Track a follow-up to clean up and re-enable as errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'ios/',
      'android/',
      'supabase/functions/',
      'scripts/',
    ],
  },
];
