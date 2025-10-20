import * as m from '@aipacto/shared-ui-localization/paraglide/messages'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { LoginForm } from '~components'
import { CoLanguageSelector } from '~components/ui'
import { getServerAuthState } from '~server'

// apps/web/src/routes/login.tsx
const safeRedirect = (value?: string) => {
	if (!value || typeof value !== 'string') return undefined
	try {
		const decoded = decodeURIComponent(value)
		// allow absolute URLs by extracting the path, else expect an absolute in-app path
		if (/^https?:\/\//i.test(decoded)) {
			const u = new URL(decoded)
			return u.pathname + (u.search || '') + (u.hash || '')
		}
		return decoded.startsWith('/') ? decoded : undefined
	} catch {
		return undefined
	}
}

export const Route = createFileRoute('/login')({
	validateSearch: (search: Record<string, unknown>) => ({
		redirect: safeRedirect(search.redirect as string | undefined),
	}),
	component: LoginPage,
	beforeLoad: async ({ search }) => {
		try {
			const session = await getServerAuthState()
			if (session?.session?.token) {
				throw redirect({ to: search.redirect ?? '/docs', replace: true })
			}
		} catch {}
	},
})

function LoginPage() {
	const { redirect: validatedRedirect } = Route.useSearch()
	const navigate = useNavigate()
	const handleLoginSuccess = () =>
		navigate({ to: validatedRedirect ?? '/docs', replace: true })
	return (
		<div className='flex flex-col min-h-screen p-4'>
			{/* Main content centered */}
			<div className='flex-1 flex items-center justify-center'>
				<LoginForm onLoginSuccess={handleLoginSuccess} />
			</div>

			{/* Language selector at bottom-end */}
			<div className='flex items-center justify-end gap-[var(--spacing-sm)] p-[var(--spacing-md)]'>
				<span className='text-[var(--font-size-body-s)] text-[var(--on-surface-variant)]'>
					{m.app_pages_login_txt_language()}
				</span>
				<CoLanguageSelector />
			</div>
		</div>
	)
}
