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
	'text-[var(--font-size-title-m)]',
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

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
	variant?: VariantProps<typeof cardVariants>['variant']
	size?: VariantProps<typeof cardVariants>['size']
	interactive?: boolean
	ref?: React.Ref<HTMLDivElement>
}

export function CoCard({
	children,
	className,
	variant,
	size,
	interactive,
	ref: forwardedRef,
	...props
}: CardProps) {
	const combinedClassName = [
		cardVariants({ variant, size, interactive }),
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div
			ref={forwardedRef}
			className={combinedClassName}
			role={interactive ? 'button' : undefined}
			tabIndex={interactive ? 0 : undefined}
			{...props}
		>
			{children}
		</div>
	)
}

CoCard.displayName = 'CoCard'

export function CoCardHeader({
	children,
	className,
	ref: forwardedRef,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	ref?: React.Ref<HTMLDivElement>
}) {
	const combinedClassName = [cardHeaderVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<div ref={forwardedRef} className={combinedClassName} {...props}>
			{children}
		</div>
	)
}

CoCardHeader.displayName = 'CoCardHeader'

export function CoCardTitle({
	children,
	className,
	ref: forwardedRef,
	...props
}: React.ComponentPropsWithoutRef<'h3'> & {
	ref?: React.Ref<HTMLHeadingElement>
}) {
	const combinedClassName = [cardTitleVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<h3 ref={forwardedRef} className={combinedClassName} {...props}>
			{children}
		</h3>
	)
}

CoCardTitle.displayName = 'CoCardTitle'

export function CoCardSubtitle({
	children,
	className,
	ref: forwardedRef,
	...props
}: React.ComponentPropsWithoutRef<'p'> & {
	ref?: React.Ref<HTMLParagraphElement>
}) {
	const combinedClassName = [cardSubtitleVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<p ref={forwardedRef} className={combinedClassName} {...props}>
			{children}
		</p>
	)
}

CoCardSubtitle.displayName = 'CoCardSubtitle'

export function CoCardContent({
	children,
	className,
	ref: forwardedRef,
	...props
}: React.ComponentPropsWithoutRef<'div'> & {
	ref?: React.Ref<HTMLDivElement>
}) {
	const combinedClassName = [cardContentVariants(), className]
		.filter(Boolean)
		.join(' ')

	return (
		<div ref={forwardedRef} className={combinedClassName} {...props}>
			{children}
		</div>
	)
}

CoCardContent.displayName = 'CoCardContent'

interface CardActionsProps extends React.ComponentPropsWithoutRef<'div'> {
	align?: 'start' | 'center' | 'end'
	ref?: React.Ref<HTMLDivElement>
}

export function CoCardActions({
	children,
	className,
	align = 'start',
	ref: forwardedRef,
	...props
}: CardActionsProps) {
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
		<div ref={forwardedRef} className={combinedClassName} {...props}>
			{children}
		</div>
	)
}

CoCardActions.displayName = 'CoCardActions'
