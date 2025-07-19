import { createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '~hooks'

/**
 * This pathless route protects all child routes by ensuring the user is
 * authenticated before they are allowed to load. If the user is not
 * authenticated, they are redirected to the login screen. The segment name
 * starts with an underscore, so it is stripped from the public URL and will
 * not appear in the browser location (eg. `/documents` instead of
 * `/_authenticated/documents`).
 */
export const Route = createFileRoute('/_authenticated')({
	beforeLoad: async ({ location }) => {
		try {
			const session = await getSession()

			// Check if session exists and has a token
			if (!session?.data?.session?.token) {
				throw redirect({
					to: '/login',
					search: {
						// Preserve the requested location so we can redirect back after login
						redirect: location.pathname,
					},
					replace: true,
				})
			}
		} catch {
			// If fetching the session fails for any reason, also redirect to login
			throw redirect({
				to: '/login',
				search: {
					redirect: location.href,
				},
				replace: true,
			})
		}
	},
})
