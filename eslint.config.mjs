import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'

import security from 'eslint-plugin-security'
import noSecrets from 'eslint-plugin-no-secrets'

const TS_FILES = ['**/*.{ts,tsx,mts,cts}']

export default defineConfig([
  ...nextVitals,
  prettier,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'tests/**',
    'test-results/**',
    'playwright-report/**',
    'chromatic-archives/**',

    // Test files
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',

    // Generated files
    'src/lib/supabase/database.types.ts',
  ]),

  {
    plugins: {
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      'react/no-danger': 'error',
      'react/no-danger-with-children': 'error',
      'no-restricted-globals': ['error', 'eval', 'Function'],
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-object-injection': 'warn',
      'no-secrets/no-secrets': 'warn',
    },
  },

  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: TS_FILES,
  })),
  {
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
