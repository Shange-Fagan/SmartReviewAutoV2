import reactPlugin from 'eslint-plugin-react';

export default [
  {
    ignores: ['dist/**'],
  },
  {
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
    files: ['**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];