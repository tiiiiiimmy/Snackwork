module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
    },
    overrides: [
        {
            files: ['cypress/**/*.ts', 'cypress/**/*.tsx'],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                '@typescript-eslint/no-namespace': 'off',
                '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            },
        },
        {
            files: ['src/test/**/*.ts', 'src/test/**/*.tsx'],
            rules: {
                'react-refresh/only-export-components': 'off',
            },
        },
    ],
} 