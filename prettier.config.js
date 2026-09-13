/** @type {import('prettier').Config} */
export default {
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    endOfLine: 'lf',
    tabWidth: 4,
    overrides: [
        {
            files: ['*.json'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
