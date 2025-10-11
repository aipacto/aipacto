import { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { DefaultCatchBoundary, NotFound } from '~components'
import { routeTree } from './routeTree.gen'

export function getRouter() {
	// Create a fresh QueryClient per request in SSR environments
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5 minutes
				// Increase staleTime for SSR to avoid immediate refetching on client
				...(typeof window === 'undefined' && { staleTime: 1000 * 60 * 60 }), // 1 hour on server
			},
		},
	})

	const router = createRouter({
		routeTree,
		context: { queryClient, language: ListSupportedLanguagesCodes.eng },
		scrollRestoration: true,
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: () => <NotFound />,
		defaultPreload: 'intent',
	})

	// Setup the SSR Query integration
	setupRouterSsrQueryIntegration({
		router,
		queryClient,
		// Let the integration handle QueryClient wrapping
		wrapQueryClient: true,
		// Handle redirects from queries/mutations
		handleRedirects: true,
	})

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
