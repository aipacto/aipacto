import { resolve } from 'node:path'
// import { getWorkspaceAliases } from '@aipacto/shared-tsconfig/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
	build: {
		emptyOutDir: true,
	},
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
		tsConfigPaths(),
		tanstackStart(),
		react(),
		tailwindcss(),
		wasm(),
		topLevelAwait(),
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
