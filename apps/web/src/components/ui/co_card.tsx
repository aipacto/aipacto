import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

const cardVariants = cva(
	[
		// Base card styling
		'bg-[var(--surface-container-low)]',
		'border border-[var(--outline-variant)]',
		'rounded-[var(--radius-lg)]',
		'text-[var(--on-surface)]',
		// Interactive states
		'transition-all duration-200 ease-out',
		// Shadow for elevation
		'shadow-[var(--layout-shadow-elevation)]',
	],
	{
		variants: {
			variant: {
				elevated: [
					'bg-[var(--surface-container-low)]',
					'border-0',
					'shadow-[var(--layout-shadow-elevation-lg)]',
				],
				filled: [
					'bg-[var(--surface-container-highest)]',
					'border border-[var(--outline-variant)]',
				],
				outlined: ['bg-[var(--surface)]', 'border border-[var(--outline)]'],
			},
			interactive: {
				true: [
					'cursor-pointer',
					'hover:bg-[var(--surface-container)]',
					'active:bg-[var(--surface-container-high)]',
					'focus-visible:outline-none',
					'focus-visible:ring-2',
					'focus-visible:ring-[var(--primary)]',
					'focus-visible:ring-offset-2',
				],
			},
			size: {
				sm: ['p-[var(--spacing-sm)]'],
				default: ['p-[var(--spacing-md)]'],
				lg: ['p-[var(--spacing-lg)]'],
			},
		},
		defaultVariants: {
			variant: 'elevated',
			size: 'default',
			interactive: false,
		},
	},
)

const cardHeaderVariants = cva([
	'flex items-center gap-[var(--spacing-md)]',
	'mb-[var(--spacing-md)]',
])

const cardTitleVariants = cva([
	'text-[var(--font-size-title)]',
	'font-medium',
	'text-[var(--on-surface)]',
	'leading-[1.2]',
])

const cardSubtitleVariants = cva([
	'text-[var(--font-size-body-m)]',
	'text-[var(--on-surface-variant)]',
	'leading-[1.4]',
])

const cardContentVariants = cva([
	'text-[var(--font-size-body-m)]',
	'text-[var(--on-surface)]',
	'leading-[1.5]',
])

const cardActionsVariants = cva([
	'flex items-center gap-[var(--spacing-sm)]',
	'mt-[var(--spacing-md)]',
	'pt-[var(--spacing-md)]',
	'border-t border-[var(--outline-variant)]',
])

export function CoCard({
	children,
	className,
	variant,
	size,
	interactive,
	asChild = false,
	...props
}: React.ComponentProps<'div'> &
	VariantProps<typeof cardVariants> & {
		children?: React.ReactNode
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : 'div'

	const combinedClassName = [
		cardVariants({ variant, size, interactive }),
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<Comp
			data-slot='card'
			className={combinedClassName}
			role={interactive ? 'button' : undefined}
			tabIndex={interactive ? 0 : undefined}
			{...props}
		>
			{children}
		</Comp>
	)
}

export function CoCardHeader({
	children,
	className,
	...props
}: React.ComponentProps<'div'> & {
	children?: React.ReactNode
}) {
	const combinedClassName = [cardHeaderVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<div data-slot='card-header' className={combinedClassName} {...props}>
			{children}
		</div>
	)
}

export function CoCardTitle({
	children,
	className,
	...props
}: React.ComponentProps<'h3'> & {
	children?: React.ReactNode
}) {
	const combinedClassName = [cardTitleVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<h3 data-slot='card-title' className={combinedClassName} {...props}>
			{children}
		</h3>
	)
}

export function CoCardSubtitle({
	children,
	className,
	...props
}: React.ComponentProps<'p'> & {
	children?: React.ReactNode
}) {
	const combinedClassName = [cardSubtitleVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<p data-slot='card-subtitle' className={combinedClassName} {...props}>
			{children}
		</p>
	)
}

export function CoCardContent({
	children,
	className,
	...props
}: React.ComponentProps<'div'> & {
	children?: React.ReactNode
}) {
	const combinedClassName = [cardContentVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<div data-slot='card-content' className={combinedClassName} {...props}>
			{children}
		</div>
	)
}

export function CoCardActions({
	children,
	className,
	align = 'start',
	...props
}: React.ComponentProps<'div'> & {
	children?: React.ReactNode
	align?: 'start' | 'center' | 'end'
}) {
	const alignmentClasses = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
	}

	const combinedClassName = [
		cardActionsVariants(),
		alignmentClasses[align],
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div data-slot='card-actions' className={combinedClassName} {...props}>
			{children}
		</div>
	)
}
