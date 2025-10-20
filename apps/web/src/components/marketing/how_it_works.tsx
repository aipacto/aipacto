import { motion } from 'motion/react'

interface Step {
	title: string
	description: string
}

interface MarketingHowItWorksProps {
	title: string
	steps: Step[]
}

export function MarketingHowItWorks({
	title,
	steps,
}: Readonly<MarketingHowItWorksProps>) {
	return (
		<section
			className='py-[var(--spacing-xxl)]'
			style={{ background: 'var(--surface-container)' }}
		>
			<div className='container mx-auto px-[var(--spacing-md)]'>
				<div className='max-w-4xl mx-auto'>
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className='text-[var(--font-size-heading-l)] font-cardo font-semibold text-center mb-[var(--spacing-xxl)]'
						style={{ color: 'var(--on-surface)' }}
					>
						{title}
					</motion.h2>

					<div className='grid md:grid-cols-3 gap-[var(--spacing-xl)]'>
						{steps.map((step, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								className='text-center'
							>
								<div
									className='w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-[var(--spacing-md)] mx-auto'
									style={{
										background: 'var(--primary)',
										color: 'var(--on-primary)',
									}}
								>
									{index + 1}
								</div>
								<h3
									className='text-[var(--font-size-title-m)] font-cardo font-semibold mb-[var(--spacing-sm)]'
									style={{ color: 'var(--on-surface)' }}
								>
									{step.title}
								</h3>
								<p
									className='text-[var(--font-size-body-m)]'
									style={{ color: 'var(--on-surface-variant)' }}
								>
									{step.description}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
