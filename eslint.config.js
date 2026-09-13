import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'coverage/**',
            'dist/**',
            'node_modules/**',
            'prisma/generated/**',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['*.js', '*.ts'],
        ...tseslint.configs.disableTypeChecked,
    },
    {
        files: ['src/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            'import-x': importPlugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            // Fastify permits synchronous callbacks that return framework-managed replies.
            '@typescript-eslint/require-await': 'off',
            'import-x/first': 'error',
            'import-x/no-duplicates': 'error',
            'import-x/no-named-as-default': 'error',
            'import-x/no-unassigned-import': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        '@prisma/client',
                        'pino',
                        'aws-sdk',
                        '@aws-sdk/*',
                    ],
                },
            ],
        },
    },
    {
        files: ['src/infrastructure/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        '../domain/**',
                        '../application/**',
                        '../../modules/**/domain/**',
                        '../../modules/**/application/**',
                    ],
                },
            ],
        },
    },
    {
        files: ['tests/**/*.ts'],
        rules: {
            'no-restricted-imports': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },
    prettier,
);
