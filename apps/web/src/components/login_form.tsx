import { useId, useState } from 'react'

import { useAuth } from '~hooks'

export function LoginForm() {
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
			const { data, error } = await authClient.signIn.email({
				email,
				password,
			})

			if (error) {
				setError(error.message ?? 'Unknown error')
			} else if (data) {
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
			const { data, error } = await authClient.signUp.email({
				email,
				password,
				name: email.split('@')[0] || '', // Use email prefix as name
			})

			if (error) {
				setError(error.message ?? 'Unknown error')
			} else if (data) {
			}
		} catch (err) {
			setError('An unexpected error occurred')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md'>
			<h2 className='text-2xl font-bold mb-6 text-center'>Sign In / Sign Up</h2>

			{error && (
				<div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
					{error}
				</div>
			)}

			<form onSubmit={handleSignIn} className='space-y-4'>
				<div>
					<label
						htmlFor={emailId}
						className='block text-sm font-medium text-gray-700'
					>
						Email
					</label>
					<input
						type='email'
						id={emailId}
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
						required
					/>
				</div>

				<div>
					<label
						htmlFor={passwordId}
						className='block text-sm font-medium text-gray-700'
					>
						Password
					</label>
					<input
						type='password'
						id={passwordId}
						value={password}
						onChange={e => setPassword(e.target.value)}
						className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
						required
					/>
				</div>

				<div className='flex space-x-4'>
					<button
						type='submit'
						disabled={isLoading}
						className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
					>
						{isLoading ? 'Signing In...' : 'Sign In'}
					</button>

					<button
						type='button'
						onClick={handleSignUp}
						disabled={isLoading}
						className='flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50'
					>
						{isLoading ? 'Signing Up...' : 'Sign Up'}
					</button>
				</div>
			</form>
		</div>
	)
}
