import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '~hooks'

interface LoginFormProps {
	onLoginSuccess?: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
	const { t } = useTranslation()
	const { authClient } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const emailId = useId()
	const passwordId = useId()

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')
		try {
			const { error } = await authClient.signIn.email({
				email,
				password,
			})
			if (error) {
				setError(error.message ?? 'Unknown error')
			} else {
				// Ensure client cache is synced with fresh session cookies
				await authClient.getSession().catch(() => undefined)
				onLoginSuccess?.()
			}
		} catch (_err) {
			setError('An unexpected error occurred')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError('')
		try {
			const { error } = await authClient.signUp.email({
				email,
				password,
				name: email.split('@')[0] || '', // Use email prefix as name
			})
			if (error) {
				setError(error.message ?? 'Unknown error')
			} else {
				await authClient.getSession().catch(() => undefined)
				onLoginSuccess?.()
			}
		} catch (_err) {
			setError('An unexpected error occurred')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='max-w-md mx-auto mt-8 p-6 bg-[var(--surface-container-low)] rounded-[var(--radius-lg)] shadow-[var(--layout-shadow-elevation)]'>
			<h2 className='text-[var(--font-size-heading-l)] font-medium mb-6 text-center text-[var(--on-surface)]'>
				{t('pages.login.title')}
			</h2>

			{error && (
				<div className='mb-4 p-3 bg-[var(--error-container)] border border-[var(--error)] text-[var(--on-error-container)] rounded-[var(--radius-md)]'>
					{error}
				</div>
			)}

			<form onSubmit={handleSignIn} className='space-y-4'>
				<div>
					<label
						htmlFor={emailId}
						className='block text-[var(--font-size-label-l)] font-medium text-[var(--on-surface)]'
					>
						{t('pages.login.plh.email')}
					</label>
					<input
						type='email'
						id={emailId}
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='mt-1 block w-full px-3 py-2 border border-[var(--outline)] rounded-[var(--radius-md)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--surface-container)] text-[var(--on-surface)]'
						required
					/>
				</div>

				<div>
					<label
						htmlFor={passwordId}
						className='block text-[var(--font-size-label-l)] font-medium text-[var(--on-surface)]'
					>
						Password
					</label>
					<input
						type='password'
						id={passwordId}
						value={password}
						onChange={e => setPassword(e.target.value)}
						className='mt-1 block w-full px-3 py-2 border border-[var(--outline)] rounded-[var(--radius-md)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--surface-container)] text-[var(--on-surface)]'
						required
					/>
				</div>

				<div className='flex space-x-4'>
					<button
						type='submit'
						disabled={isLoading}
						className='flex-1 bg-[var(--primary)] text-[var(--on-primary)] py-2 px-4 rounded-[var(--radius-md)] hover:bg-[var(--primary-container)] hover:text-[var(--on-primary-container)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50'
					>
						{isLoading ? t('misc.txt.loading') : t('pages.login.btn.access')}
					</button>

					<button
						type='button'
						onClick={handleSignUp}
						disabled={isLoading}
						className='flex-1 bg-[var(--secondary)] text-[var(--on-secondary)] py-2 px-4 rounded-[var(--radius-md)] hover:bg-[var(--secondary-container)] hover:text-[var(--on-secondary-container)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:ring-offset-2 disabled:opacity-50'
					>
						{isLoading
							? t('misc.txt.loading')
							: t('pages.login.btn.create_account')}
					</button>
				</div>
			</form>
		</div>
	)
}
