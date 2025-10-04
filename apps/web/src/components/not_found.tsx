import { Link } from '@tanstack/react-router'
import { FileQuestion } from 'lucide-react'

export function NotFound() {
	return (
		<div className='flex flex-1 items-center justify-center p-[var(--spacing-lg)]'>
			<div className='flex flex-col items-center gap-[var(--spacing-md)] text-center'>
				<FileQuestion className='w-16 h-16 text-[var(--on-surface-variant)]' />
				<h1 className='text-[var(--font-size-heading-l)] font-medium text-[var(--on-surface)]'>
					Page not found
				</h1>
				<p className='text-[var(--font-size-body-m)] text-[var(--on-surface-variant)]'>
					The page you're looking for doesn't exist.
				</p>
				<Link
					to='/docs'
					className='mt-[var(--spacing-sm)] px-[var(--spacing-lg)] py-[var(--spacing-sm)] bg-[var(--primary)] text-[var(--on-primary)] rounded-[var(--radius-md)] font-medium hover:bg-[var(--primary-container)] hover:text-[var(--on-primary-container)] transition-colors'
				>
					Go to Documents
				</Link>
			</div>
		</div>
	)
}
