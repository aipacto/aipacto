import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'

import { DefaultCatchBoundary, NotFound } from '~components'
import { routeTree } from './routeTree.gen'

export function createRouter() {
	const queryClient = new QueryClient()

	return routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			context: { queryClient },
			scrollRestoration: true,
			defaultErrorComponent: DefaultCatchBoundary,
			defaultNotFoundComponent: () => <NotFound />,
		}),
		queryClient,
	)
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof createRouter>
	}
}
