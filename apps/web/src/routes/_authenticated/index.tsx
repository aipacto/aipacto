import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Root index route that redirects to /docs
 * This route is protected by the _authenticated layout
 */
export const Route = createFileRoute('/_authenticated/')({
	beforeLoad: () => {
		throw redirect({ to: '/docs' })
	},
})
