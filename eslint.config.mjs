/**
 * ESLint configuration for React Compiler
 *
 * https://react.dev/blog/2025/10/07/react-compiler-1
 */

import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import reactCompiler from 'eslint-plugin-react-compiler'

export default [
	{
		files: ['apps/web/src/**/*.{ts,tsx}'],
		ignores: [
			'**/.nitro/**',
			'**/.output/**',
			'**/.tanstack/**',
			'**/.tamagui/**',
			'**/dist/**',
			'**/node_modules/**',
			'**/*.gen.ts',
			'**/*.gen.tsx',
		],
		languageOptions: {
			parser: parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
				project: './apps/web/tsconfig.json',
			},
		},
		plugins: {
			'react-compiler': reactCompiler,
			'@typescript-eslint': tseslint,
		},
		rules: {
			'react-compiler/react-compiler': 'error',
		},
	},
]
