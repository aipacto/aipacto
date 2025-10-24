import { resolve } from 'node:path'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
	build: {
		target: 'esnext', // Prevent the usage of top-level await (vite-plugin-top-level-await) for Loro CRDT
	},
	resolve: {
		alias: [
			{
				find: '@',
				replacement: resolve(__dirname, 'src'),
			},
			{
				find: '~components',
				replacement: resolve(__dirname, 'src/components'),
			},
			{
				find: '~components/marketing',
				replacement: resolve(__dirname, 'src/components/marketing'),
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
			{
				find: '~server',
				replacement: resolve(__dirname, 'src/server'),
			},
			{
				find: '~server/functions',
				replacement: resolve(__dirname, 'src/server/functions'),
			},
		],
	},
	plugins: [
		tailwindcss(),
		paraglideVitePlugin({
			project: '../../packages/shared/ui/localization/project.inlang',
			outdir: '../../packages/shared/ui/localization/src/paraglide',
		}),
		tanstackStart(),
		tsConfigPaths(),
		nitroV2Plugin({
			preset: 'node-server',
			serveStatic: true,
		}),
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler', {}]],
			},
		}),
		wasm(),
	],
	server: {
		open: false,
		port: 3001,
		proxy:
			mode === 'development'
				? {
						// Proxy auth and API requests to backend in development
						// This makes auth cookies work by keeping same origin
						'/auth': {
							target: 'http://localhost:3000',
							changeOrigin: false, // Keep localhost origin
							secure: false,
						},
						'/v1': {
							target: 'http://localhost:3000',
							changeOrigin: false,
							secure: false,
							ws: true, // Enable WebSocket proxying
						},
					}
				: undefined,
	},
}))
