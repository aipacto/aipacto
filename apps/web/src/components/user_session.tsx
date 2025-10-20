import { motion } from 'motion/react'
import { useCallback } from 'react'

import { signOut, useSession } from '~hooks'
import { CoButtonText } from './ui/co_button_text'

interface UserSessionProps {
	className?: string
}

export function UserSession({ className = '' }: UserSessionProps) {
	const session = useSession()

	const handleSignOut = useCallback(async () => {
		try {
			await signOut()
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}, [])

	if (session.isPending) {
		return (
			<div className={`flex items-center justify-center p-4 ${className}`}>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin' />
					<span className='text-[var(--font-size-body-m)] text-[var(--on-surface-variant)]'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!session.data) {
		return null
	}

	const { user } = session.data
	const displayName = user.name || user.email || 'Unknown User'
	const email = user.email || ''
	const firstLetter = displayName.charAt(0).toUpperCase()

	return (
		<motion.div
			className={`user-session bg-[var(--surface-container)] border-t ${className}`}
			style={{
				borderColor: 'color-mix(in srgb, var(--outline) 20%, transparent)',
			}}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				type: 'spring',
				stiffness: 300,
				damping: 30,
			}}
		>
			<div className='flex items-center gap-3 p-4'>
				{/* User Avatar */}
				<div className='flex-shrink-0'>
					<div className='w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center'>
						<span className='text-[var(--font-size-body-m)] font-medium text-[var(--on-primary)]'>
							{firstLetter}
						</span>
					</div>
				</div>

				{/* User Info */}
				<div className='flex-1 min-w-0'>
					<div className='text-[var(--font-size-body-m)] font-medium text-[var(--on-surface)] truncate'>
						{displayName}
					</div>
					{email && (
						<div className='text-[var(--font-size-body-s)] text-[var(--on-surface-variant)] truncate'>
							{email}
						</div>
					)}
				</div>

				{/* Sign Out Button */}
				<CoButtonText
					variant='outlined'
					size='sm'
					onClick={handleSignOut}
					className='flex-shrink-0'
					aria-label='Sign out'
				>
					<svg
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
						focusable='false'
					>
						<title>Sign out</title>
						<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
						<polyline points='16,17 21,12 16,7' />
						<line x1='21' y1='12' x2='9' y2='12' />
					</svg>
				</CoButtonText>
			</div>
		</motion.div>
	)
}
