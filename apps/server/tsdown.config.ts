import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['src/index.ts'],
	outDir: 'dist',
	format: 'esm',
	target: 'node24',
	clean: true,
	sourcemap: true,
})
