import { motion } from 'motion/react'

interface MarketingCTAProps {
	title: string
	buttonText: string
}

export function MarketingCTA({
	title,
	buttonText,
}: Readonly<MarketingCTAProps>) {
	return (
		<section className='py-[var(--spacing-xxl)]'>
			<div className='container mx-auto px-[var(--spacing-md)]'>
				<div className='max-w-2xl mx-auto text-center'>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className='text-[var(--font-size-heading-l)] font-cardo font-semibold mb-[var(--spacing-lg)]'
						style={{ color: 'var(--on-surface)' }}
					>
						{title}
					</motion.h2>

					<motion.a
						href='mailto:general@aipacto.com'
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='inline-block px-[var(--spacing-xl)] py-[var(--spacing-md)] rounded-[var(--radius-lg)] font-semibold text-[var(--font-size-body-l)] transition-all duration-200'
						style={{
							background: 'var(--primary)',
							color: 'var(--on-primary)',
						}}
					>
						{buttonText}
					</motion.a>
				</div>
			</div>
		</section>
	)
}
