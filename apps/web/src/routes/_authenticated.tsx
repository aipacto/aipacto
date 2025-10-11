import { createFileRoute, redirect } from '@tanstack/react-router'

import { getServerAuthState } from '~server'

/**
 * This pathless route protects all child routes by ensuring the user is
 * authenticated before they are allowed to load. If the user is not
 * authenticated, they are redirected to the login screen.
 */
export const Route = createFileRoute('/_authenticated')({
	loader: async ({ location }) => {
		const state = await getServerAuthState()

		// biome-ignore lint/suspicious/noConsole: <explanation>
		console.log('state', state)
		if (!state?.session?.token) {
			throw redirect({
				to: '/login',
				search: { redirect: location.href ?? location.pathname },
				replace: true,
			})
		}
		return state
	},
})
