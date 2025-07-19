import { resolve } from 'node:path'
// import { getWorkspaceAliases } from '@aipacto/shared-tsconfig/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { univerPlugin } from '@univerjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
	build: {
		emptyOutDir: true,
		outDir: '../dist',
	},
	envDir: '..',
	resolve: {
		alias: [
			// ...getWorkspaceAliases(),
			{
				find: '@',
				replacement: resolve(__dirname, 'src'),
			},
			{
				find: '~components',
				replacement: resolve(__dirname, 'src/components'),
			},
			{
				find: '~components/ui',
				replacement: resolve(__dirname, 'src/components/ui'),
			},
			{
				find: '~lib',
				replacement: resolve(__dirname, 'src/lib'),
			},
			{
				find: '~hooks',
				replacement: resolve(__dirname, 'src/hooks'),
			},
		],
	},
	plugins: [
		tsConfigPaths(),
		tanstackStart({
			customViteReactPlugin: true,
		}),
		react(),
		univerPlugin(),
		tailwindcss(),
		wasm(),
		topLevelAwait(),
	],
	server: {
		open: false,
		port: 3001,
	},
}))
