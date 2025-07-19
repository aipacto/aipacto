import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { LoginForm } from '~components'
import { getSession, useSession } from '~hooks'

export const Route = createFileRoute('/login')({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: search.redirect as string | undefined,
	}),
	component: LoginPage,
	beforeLoad: async () => {
		try {
			const session = await getSession()
			if (session?.data?.session?.token) {
				throw redirect({ to: '/docs' })
			}
		} catch {
			// If session check fails, continue to login page
		}
	},
})

function LoginPage() {
	const search = Route.useSearch()
	const session = useSession()
	const router = useRouter()

	// If user is already logged in, redirect to the original destination
	useEffect(() => {
		if (session.data?.session?.token) {
			const redirectTo = search.redirect || '/'
			router.navigate({ to: redirectTo, replace: true })
		}
	}, [session.data, search.redirect, router])

	return (
		<div className='flex items-center justify-center min-h-screen p-4'>
			<LoginForm />
		</div>
	)
}
