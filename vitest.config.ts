import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            thresholds: {
                'src/domain/**': {
                    lines: 90,
                    functions: 90,
                    statements: 90,
                    branches: 90,
                },
                'src/application/**': {
                    lines: 80,
                    functions: 80,
                    statements: 80,
                    branches: 80,
                },
                'src/api/**': {
                    lines: 70,
                    functions: 70,
                    statements: 70,
                    branches: 70,
                },
            },
        },
    },
});
