import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation()
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
					{t('pages.login.txt.language')}
				</span>
				<CoLanguageSelector />
			</div>
		</div>
	)
}
