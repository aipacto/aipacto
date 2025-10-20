import * as m from '@aipacto/shared-ui-localization/paraglide/messages'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { UnderConstruction } from '~components/marketing'
import { CoLanguageSelector, CoThemeSelector } from '~components/ui'

export const Route = createFileRoute('/_marketing')({
	component: MarketingLayout,
})

function MarketingLayout() {
	return (
		<div className='flex flex-col h-screen overflow-hidden bg-[var(--surface)] text-[var(--on-surface)]'>
			<NavBar />
			<div className='flex-1 overflow-auto'>
				<Outlet />
				<MarketingFooter />
			</div>
		</div>
	)
}

function NavBar() {
	const [open, setOpen] = useState(false)

	// Close on route change or window resize
	useEffect(() => {
		const onResize = () => setOpen(false)
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])

	return (
		<header
			className='w-full sticky top-0 z-[var(--z-index-sticky)]'
			style={{
				backdropFilter: 'blur(18px)',
				WebkitBackdropFilter: 'blur(18px)',
			}}
		>
			<div
				className='flex items-center justify-between rounded-[var(--radius-xl)] p-[var(--spacing-xxs)]'
				style={{
					margin: 'var(--spacing-md)',
					borderColor: 'color-mix(in srgb, var(--outline) 45%, transparent)',
					background:
						'color-mix(in srgb, var(--surface-container-highest) 65%, transparent)',
				}}
			>
				<div
					className='flex items-center'
					style={{
						gap: 'var(--spacing-md)',
						marginInlineStart: 'var(--spacing-sm)',
					}}
				>
					<Link
						to='/'
						className='text-[var(--font-size-title-l)] font-cinzel font-semibold'
					>
						Aipacto
					</Link>
				</div>

				{/* Desktop nav */}
				<nav
					className='hidden md:flex items-center'
					style={{ gap: 'var(--spacing-lg)' }}
				>
					{/* <Link
						to={session?.user ? '/dashboard' : '/login'}
						search={{ redirect: undefined }}
						onMouseEnter={() => {
							// Preload auth route
							router.preloadRoute({
								to: session?.user ? '/dashboard' : '/login',
							})
						}}
					>
						<CoButtonText
							variant='text'
							className='transform-gpu hover:scale-[1.03] focus-visible:scale-[1.03] active:scale-[1.05]'
						>
							{session?.user
								? m.marketing_pages_marketing_layout_dashboard()
								: m.marketing_pages_marketing_layout_login()}
						</CoButtonText>
					</Link> */}
					<UnderConstruction />
				</nav>

				{/* Mobile hamburger */}
				<button
					type='button'
					aria-label={m.marketing_pages_marketing_layout_menu()}
					className='md:hidden inline-flex items-center justify-center rounded-[var(--radius-lg)] border'
					onClick={() => setOpen(v => !v)}
					style={{
						marginInlineEnd: 'var(--spacing-md)',
						borderColor: 'var(--outline-variant)',
						inlineSize: 'calc(var(--spacing-xxl) * 1.2)',
						blockSize: 'calc(var(--spacing-xxl) * 1.2)',
						background: 'var(--surface)',
					}}
				>
					<span
						aria-hidden
						style={{
							display: 'block',
							inlineSize: '18px',
							blockSize: '2px',
							background: 'var(--on-surface)',
							boxShadow:
								'0 6px 0 0 var(--on-surface), 0 -6px 0 0 var(--on-surface)',
						}}
					/>
				</button>
			</div>

			{/* Mobile menu panel */}
			{open ? (
				<div
					className='md:hidden rounded-[var(--radius-xl)] border overflow-hidden'
					style={{
						marginTop: 'var(--spacing-sm)',
						borderColor: 'var(--outline-variant)',
						background: 'var(--surface-container)',
					}}
				>
					<div
						style={{
							paddingInline: 'var(--spacing-md)',
							paddingBlock: 'var(--spacing-sm)',
						}}
					>
						{/* <Link
							to={session?.user ? '/dashboard' : '/login'}
							search={{ redirect: undefined }}
							onClick={() => setOpen(false)}
							onMouseEnter={() => {
								router.preloadRoute({
									to: session?.user ? '/dashboard' : '/login',
								})
							}}
						>
							<CoButtonText
								variant='text'
								size='default'
								className='transform-gpu hover:scale-[1.03] focus-visible:scale-[1.03] active:scale-[1.05]'
							>
								{session?.user
									? m.marketing_pages_marketing_layout_dashboard()
									: m.marketing_pages_marketing_layout_login()}
							</CoButtonText>
						</Link> */}
						<UnderConstruction />
					</div>
				</div>
			) : null}
		</header>
	)
}

function MarketingFooter() {
	return (
		<footer className='w-full' style={{ padding: 'var(--spacing-md)' }}>
			<div
				className='flex items-center justify-between'
				style={{ gap: 'var(--spacing-md)' }}
			>
				<div className='flex items-center' style={{ gap: 'var(--spacing-sm)' }}>
					<Link
						to='/'
						className='text-[var(--font-size-title-m)] font-cinzel font-semibold'
					>
						Aipacto
					</Link>
				</div>
				<div className='flex items-center' style={{ gap: 'var(--spacing-md)' }}>
					<CoLanguageSelector />
					<CoThemeSelector />
				</div>
			</div>
		</footer>
	)
}
