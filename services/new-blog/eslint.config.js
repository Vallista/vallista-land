import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default tseslint.config(
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '*.config.js', '*.config.ts']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: resolve(__dirname, './tsconfig.json')
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/internal-regex': '^@(shared|app|pages|widgets|features|entities|configs)/'
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      // Import 정렬 규칙
      // 순서: library import -> absolute path import -> relative path import
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'], // Library imports (react, react-dom, 외부 라이브러리)
            'internal', // Absolute path imports (@shared, @app 등)
            ['parent', 'sibling', 'index'], // Relative path imports (../, ./)
            'object',
            'type'
          ],
          pathGroups: [
            {
              pattern: '@vallista/**',
              group: 'external'
            },
            {
              pattern: '@shared/**',
              group: 'internal'
            },
            {
              pattern: '@app/**',
              group: 'internal'
            },
            {
              pattern: '@pages/**',
              group: 'internal'
            },
            {
              pattern: '@widgets/**',
              group: 'internal'
            },
            {
              pattern: '@features/**',
              group: 'internal'
            },
            {
              pattern: '@entities/**',
              group: 'internal'
            },
            {
              pattern: '@configs/**',
              group: 'internal'
            },
            {
              pattern: '@/**',
              group: 'internal'
            }
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/no-unresolved': 'off' // TypeScript가 이미 체크하므로 off
    }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly'
      }
    }
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  }
)
