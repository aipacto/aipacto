import { motion } from 'motion/react'

import { BenefitRow } from './benefit_row'

interface BenefitItem {
	title: string
	description: string
	diagram: 'documents' | 'knowledge' | 'citizen'
}

interface MarketingBenefitsProps {
	title: string
	description: string
	items: BenefitItem[]
	footer: string
}

export function MarketingBenefits({
	title,
	description,
	items,
	footer,
}: Readonly<MarketingBenefitsProps>) {
	return (
		<section className='py-[var(--spacing-xxl)]'>
			<div className='container mx-auto px-[var(--spacing-md)]'>
				<div className='max-w-4xl mx-auto text-center mb-[var(--spacing-xxl)]'>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className='text-[var(--font-size-heading-l)] font-cardo font-semibold mb-[var(--spacing-md)]'
						style={{ color: 'var(--on-surface)' }}
					>
						{title}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className='text-[var(--font-size-body-l)]'
						style={{ color: 'var(--on-surface-variant)' }}
					>
						{description}
					</motion.p>
				</div>

				<div className='space-y-[var(--spacing-xxl)]'>
					{items.map((item, _index) => (
						<BenefitRow
							key={item.diagram}
							title={item.title}
							description={item.description}
							type={item.diagram}
						/>
					))}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className='text-center mt-[var(--spacing-xxl)]'
				>
					<p
						className='text-[var(--font-size-body-m)] italic'
						style={{ color: 'var(--on-surface-variant)' }}
					>
						{footer}
					</p>
				</motion.div>
			</div>
		</section>
	)
}
