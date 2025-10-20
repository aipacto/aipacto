import { ClientOnly } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { lazy, Suspense } from 'react'

const Diagram = lazy(() => import('./diagram'))

interface BenefitRowProps {
	title: string
	description: string
	type: 'documents' | 'knowledge' | 'citizen'
}

function DiagramSkeleton() {
	return (
		<div
			className='h-[45vh] rounded-lg border-2 bg-[var(--surface-container)] animate-pulse'
			style={{
				minHeight: '280px',
				borderColor: 'var(--outline)',
			}}
		/>
	)
}

export function BenefitRow({
	title,
	description,
	type,
}: Readonly<BenefitRowProps>) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.3 }}
			transition={{ duration: 0.5, ease: 'easeOut' }}
			className='flex flex-col xl:grid xl:grid-cols-[1fr_minmax(400px,640px)] xl:items-center'
			style={{ gap: 'var(--spacing-lg)' }}
		>
			<div className='flex flex-col' style={{ gap: 'var(--spacing-sm)' }}>
				<h3 className='text-[var(--font-size-heading-m)] font-cardo font-semibold'>
					{title}
				</h3>
				<p className='text-[var(--font-size-body-l)] text-[var(--on-surface-variant)]'>
					{description}
				</p>
			</div>
			<ClientOnly fallback={<DiagramSkeleton />}>
				<Suspense fallback={<DiagramSkeleton />}>
					<Diagram type={type} />
				</Suspense>
			</ClientOnly>
		</motion.section>
	)
}
