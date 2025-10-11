import type { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import { createI18nInstance } from '@aipacto/shared-ui-localization'
import type { QueryClient } from '@tanstack/react-query'
import {
	ClientOnly,
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'

import { NotFound } from '~components'
import { AuthProvider } from '~hooks'
import { detectServerLanguage } from '~server/functions'

import '../styles/global.css'

export interface RouterContext {
	queryClient: QueryClient
	language: ListSupportedLanguagesCodes
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	beforeLoad: async () => {
		// Detect language on server
		const language = await detectServerLanguage()

		return { language }
	},
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'Aipacto - AI-Powered City Council Platform',
			},
			{
				name: 'description',
				content:
					'AI-driven platform for city councils, workers, and citizens. Collaborative workspace with real-time editing, permissions, and document management.',
			},
			{
				name: 'keywords',
				content: 'city council, AI, government, document management',
			},
			{
				name: 'author',
				content: 'Aipacto',
			},
			{
				name: 'robots',
				content: 'index, follow',
			},
			// Open Graph
			{
				property: 'og:title',
				content: 'Aipacto - AI-Powered City Council Platform',
			},
			{
				property: 'og:description',
				content:
					'AI-driven platform for city councils, workers, and citizens. Collaborative workspace with real-time editing, permissions, and document management.',
			},
			{
				property: 'og:type',
				content: 'website',
			},
			{
				property: 'og:url',
				content: 'https://aipacto.com',
			},
			{
				property: 'og:image',
				content: '/og-image.png',
			},
			{
				property: 'og:image:width',
				content: '1200',
			},
			{
				property: 'og:image:height',
				content: '630',
			},
			{
				property: 'og:site_name',
				content: 'Aipacto',
			},
			// Twitter Card
			{
				name: 'twitter:card',
				content: 'summary_large_image',
			},
			{
				name: 'twitter:title',
				content: 'Aipacto - AI-Powered City Council Platform',
			},
			{
				name: 'twitter:description',
				content:
					'AI-driven platform for city councils, workers, and citizens. Collaborative workspace with real-time editing, permissions, and document management.',
			},
			{
				name: 'twitter:image',
				content: '/og-image.png',
			},
			// Additional SEO with theme colors
			{
				name: 'theme-color',
				content: '#3b6939',
			},
			{
				name: 'msapplication-TileColor',
				content: '#3b6939',
			},
			{
				name: 'apple-mobile-web-app-capable',
				content: 'yes',
			},
			{
				name: 'apple-mobile-web-app-status-bar-style',
				content: 'default',
			},
			{
				name: 'apple-mobile-web-app-title',
				content: 'Aipacto',
			},
		],
		links: [
			{
				rel: 'icon',
				href: '/favicon.ico',
			},
			{
				rel: 'apple-touch-icon',
				sizes: '180x180',
				href: '/apple-touch-icon.png',
			},
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '32x32',
				href: '/favicon-32x32.png',
			},
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '16x16',
				href: '/favicon-16x16.png',
			},
			{
				rel: 'manifest',
				href: '/site.webmanifest',
			},
			{
				rel: 'canonical',
				href: 'https://aipacto.com',
			},
		],
	}),
	notFoundComponent: () => <NotFound />,
})

function RootComponent() {
	const { language } = Route.useRouteContext()

	// Create i18n instance with detected language
	const i18n = createI18nInstance({ language })

	return (
		<RootDocument>
			<I18nextProvider i18n={i18n}>
				<AuthProvider>
					<Outlet />
				</AuthProvider>
			</I18nextProvider>
		</RootDocument>
	)
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	const { language } = Route.useRouteContext()

	// Determine text direction based on language
	const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language)
	const dir = isRTL ? 'rtl' : 'ltr'

	return (
		<html lang={language} dir={dir}>
			<head>
				<HeadContent />
			</head>
			<body
				style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}
			>
				<div
					style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
				>
					{children}
				</div>
				<Scripts />
				<ClientOnly fallback={null}>
					{import.meta.env.DEV ? (
						<TanStackRouterDevtools position='bottom-right' />
					) : null}
				</ClientOnly>
			</body>
		</html>
	)
}
