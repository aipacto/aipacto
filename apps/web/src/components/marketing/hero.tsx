import { delay, wrap } from 'motion'
import { motion } from 'motion/react'
import { Typewriter } from 'motion-plus/react'
import { useState } from 'react'

interface MarketingHeroProps {
	headline: string
	taglinePrefix: string
	loopPhrases: string[]
	description: string
}

export function MarketingHero({
	headline,
	taglinePrefix,
	loopPhrases,
	description,
}: Readonly<MarketingHeroProps>) {
	const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

	return (
		<section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
			<div className='container mx-auto px-[var(--spacing-md)] py-[var(--spacing-xl)]'>
				<div className='max-w-4xl mx-auto text-center'>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className='text-[var(--font-size-display-l)] font-cinzel font-bold mb-[var(--spacing-lg)]'
						style={{ color: 'var(--on-surface)' }}
					>
						{headline}
					</motion.h1>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className='flex flex-col items-center gap-[var(--spacing-xs)] mb-[var(--spacing-md)]'
					>
						<div
							className='text-[var(--font-size-title-l)] font-cardo'
							style={{ color: 'var(--on-surface-variant)' }}
						>
							{taglinePrefix}
						</div>

						<div className='min-h-[1.2em] flex items-start justify-center w-full'>
							<Typewriter
								as='div'
								cursorStyle={{
									background: 'var(--primary)',
									width: 3,
									height: '1em',
								}}
								onComplete={() => {
									delay(
										() =>
											setCurrentPhraseIndex(
												wrap(0, loopPhrases.length, currentPhraseIndex + 1),
											),
										1,
									)
								}}
								textStyle={{
									fontSize: 'var(--font-size-title-l)',
									fontWeight: 700,
									lineHeight: 1.2,
									color: 'var(--primary)',
									fontFamily: 'var(--font-cardo)',
								}}
							>
								{loopPhrases[currentPhraseIndex]}
							</Typewriter>
						</div>
					</motion.div>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className='text-[var(--font-size-body-l)] max-w-2xl mx-auto'
						style={{ color: 'var(--on-surface-variant)' }}
					>
						{description}
					</motion.p>
				</div>
			</div>
		</section>
	)
}
