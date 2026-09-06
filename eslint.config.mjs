import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/',
    '.astro/',
    'node_modules/',
    'test-results/',
    'playwright-report/',
    'reports/',
    'lighthouse-report/',
  ]),
  {
    files: ['**/*.{js,mjs,ts,astro}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.astro/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  // Astro's parser understands template references and extracts browser scripts.
  // `astro check` supplies type checking for the complete component/template.
  {
    files: ['**/*.astro', '**/*.astro/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    files: ['src/data/**/*.ts', 'src/lib/**/*.ts', 'src/types/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.astro'],
              message:
                'Shared data and helpers must not depend on view components. Put shared contracts in src/types or src/lib.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/scripts/**/*.{js,ts}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.astro/*.{js,ts}'],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
