module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './packages/tsconfig.settings.json',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended'
  ],
  env: {
    browser: true,
    node: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './packages/tsconfig.settings.json'
      }
    }
  },
  rules: {
    eqeqeq: ['error', 'always'],
    'import/order': [
      'warn',
      {
        alphabetize: {
          order: 'asc'
        },
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'internal', ['sibling', 'parent', 'index']]
      }
    ],
    'prettier/prettier': 'warn',
    '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        allowExpressions: true
      }
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      {
        overrides: {
          constructors: 'no-public'
        }
      }
    ],
    '@typescript-eslint/member-ordering': [
      'warn',
      {
        classes: {
          memberTypes: [
            'public-static-method',
            'public-decorated-method',
            'public-instance-method',
            'public-abstract-method',

            'protected-static-method',
            'protected-decorated-method',
            'protected-instance-method',
            'protected-abstract-method',

            'private-static-method',
            'private-decorated-method',
            'private-instance-method',
            'private-abstract-method',

            'public-constructor',
            'protected-constructor',
            'private-constructor',

            'signature',

            'public-static-field',
            'public-decorated-field',
            'public-instance-field',
            'public-abstract-field',

            'protected-static-field',
            'protected-decorated-field',
            'protected-instance-field',
            'protected-abstract-field',

            'private-static-field',
            'private-decorated-field',
            'private-instance-field',
            'private-abstract-field'
          ]
        }
      }
    ],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase']
      },
      {
        selector: ['accessor', 'typeLike'],
        format: ['PascalCase']
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE']
      }
    ],
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/no-shadow': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_+', ignoreRestSiblings: true }],
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/require-await': 'warn'
  }
}
