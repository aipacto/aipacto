import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'

const buttonVariants = cva(
	[
		// Reset and base layout
		'appearance-none border-0 cursor-pointer',
		// Ensure button shrinks to content and respects parent alignment
		'inline-flex items-center justify-center shrink-0',
		'width-auto', // Explicitly prevents stretching
		// Typography
		'font-medium leading-[1.25] tracking-[0.1em]',
		// Spacing and sizing
		'gap-2 whitespace-nowrap',
		// Interactive states
		'transition-all duration-200 ease-out',
		'disabled:pointer-events-none',
		// Focus states
		'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		// Icon handling
		"[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
		// User interaction
		'select-none',
	],
	{
		variants: {
			variant: {
				filled: [
					'bg-[var(--primary-container)] text-[var(--on-primary-container)]',
					'rounded-[var(--radius-md)]',
					'hover:bg-[var(--primary-container)] hover:opacity-[0.88]',
					'active:bg-[var(--primary-container)] active:opacity-[0.76]',
					'focus-visible:ring-[var(--primary)]',
					'disabled:opacity-30',
				],
				filledTonal: [
					'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]',
					'rounded-[var(--radius-md)]',
					'hover:bg-[var(--secondary-container)] hover:opacity-[0.92]',
					'active:bg-[var(--secondary-container)] active:opacity-[0.84]',
					'focus-visible:ring-[var(--secondary)]',
					'disabled:opacity-30',
				],
				outlined: [
					'bg-transparent text-[var(--primary)]',
					'border border-[var(--primary)]',
					'rounded-[var(--radius-md)]',
					'hover:bg-[var(--surface-container)]',
					'active:bg-[var(--surface-container-high)]',
					'focus-visible:ring-[var(--primary)]',
					'disabled:border-[var(--surface-container-highest)] disabled:text-[var(--surface-container-highest)]',
				],
				text: [
					'bg-transparent text-[var(--primary)]',
					'rounded-[var(--radius-md)]',
					'hover:bg-[var(--surface-container-high)]',
					'active:bg-[var(--surface-container-highest)]',
					'focus-visible:ring-[var(--primary)]',
					'disabled:opacity-40',
				],
				error: [
					'bg-[var(--error)] text-[var(--on-error)]',
					'rounded-[var(--radius-md)]',
					'hover:bg-[var(--error-container)] hover:text-[var(--on-error-container)]',
					'active:bg-[var(--error)] active:text-[var(--on-error)]',
					'focus-visible:ring-[var(--error)]',
					'disabled:opacity-30',
				],
			},
			size: {
				default: [
					'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
					'text-[var(--font-size-label-l)]',
				],
				sm: [
					'px-[var(--spacing-sm)] py-[var(--spacing-xs)]',
					'text-[var(--font-size-label-m)]',
				],
				lg: [
					'px-[var(--spacing-lg)] py-[var(--spacing-md)]',
					'text-[var(--font-size-label-l)]',
				],
			},

			fullWidth: {
				true: ['w-full', 'self-stretch'],
			},
			align: {
				start: ['self-start'],
				center: ['self-center'],
				end: ['self-end'],
			},
		},
		defaultVariants: {
			variant: 'filled',
			size: 'default',
			align: 'start',
			fullWidth: false,
		},
	},
)

const Spinner = ({ size = 'default' }: { size?: 'small' | 'default' }) => (
	<span
		aria-live='polite'
		className={`animate-spin rounded-full border-2 border-current border-t-transparent ${
			size === 'small' ? 'h-4 w-4' : 'h-5 w-5'
		}`}
	>
		<span className='sr-only'>Loading</span>
	</span>
)

export function CoButtonText({
	children,
	className,
	variant,
	size,
	disabled,
	fullWidth,
	align,
	isLoading = false,
	leadingIcon,
	trailingIcon,
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		children?: React.ReactNode
		leadingIcon?: LucideIcon
		trailingIcon?: LucideIcon
		isLoading?: boolean
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : 'button'

	const isDisabled = disabled || isLoading

	// Helper function to render Lucide icons with proper sizing
	const renderIcon = (IconComponent: LucideIcon | undefined) => {
		if (!IconComponent) return null

		const iconSize =
			size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
		const iconClasses = `shrink-0 ${iconSize}`

		return <IconComponent className={iconClasses} />
	}

	// Combine CVA classes with any additional className
	const combinedClassName = [
		buttonVariants({ variant, size, fullWidth, align }),
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<Comp
			data-slot='button'
			className={combinedClassName}
			disabled={isDisabled}
			{...props}
		>
			{/* Loading spinner takes precedence */}
			{isLoading ? (
				<Spinner size={size === 'sm' ? 'small' : 'default'} />
			) : (
				<>
					{/* Leading icon */}
					{renderIcon(leadingIcon)}

					{/* Button text */}
					{children && <span>{children}</span>}

					{/* Trailing icon */}
					{renderIcon(trailingIcon)}
				</>
			)}
		</Comp>
	)
}
