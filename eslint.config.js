import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from '@vue/eslint-config-typescript'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.vite/**', 'tmp/**'],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...tseslint(),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/require-default-prop': 'off',
    },
  },
]
