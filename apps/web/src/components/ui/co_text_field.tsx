import { cva } from 'class-variance-authority'
import type * as React from 'react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'

const containerVariants = cva(
	// Base container styles
	[
		// Layout
		'relative w-full',
		'min-h-[56px]',
		// Typography
		'text-[var(--font-size-body-m)] leading-[1.5]',
	],
	{
		variants: {
			disabled: {
				true: ['opacity-50', 'cursor-not-allowed'],
			},
		},
	},
)

const fieldsetVariants = cva(
	// Fieldset for border with gap for floating label
	[
		'absolute inset-0',
		'border border-[var(--outline)]',
		'rounded-[var(--radius-md)]',
		'transition-all duration-200 ease-out',
		'pointer-events-none',
	],
	{
		variants: {
			state: {
				default: ['border-[var(--outline)]'],
				hover: ['border-[var(--on-surface-variant)]'],
				focused: ['border-[var(--primary)]', 'border-2'],
				error: ['border-[var(--error)]', 'border-2'],
			},
		},
		defaultVariants: {
			state: 'default',
		},
	},
)

const legendVariants = cva(
	// Legend creates the gap in the border for the floating label
	[
		'px-[var(--spacing-xs)]',
		'max-w-[0.01px]',
		'transition-all duration-200 ease-out',
		'opacity-0',
		'text-[var(--font-size-label-m)]',
		'leading-[1]',
		'whitespace-nowrap',
	],
	{
		variants: {
			hasFloatingLabel: {
				true: [
					'max-w-[1000px]',
					'opacity-0', // Keep invisible but maintain space
				],
			},
		},
	},
)

const labelVariants = cva(
	// Label styles
	[
		'absolute start-[var(--spacing-md)] pointer-events-none',
		'text-[var(--font-size-label-m)]',
		'transition-all duration-200 ease-out',
		'select-none',
		'origin-[start_center]',
	],
	{
		variants: {
			state: {
				default: ['text-[var(--on-surface-variant)]'],
				focused: ['text-[var(--primary)]'],
				error: ['text-[var(--error)]'],
			},
			position: {
				placeholder: [
					'top-[50%]',
					'-translate-y-[50%]',
					'scale-100',
					'text-[var(--font-size-body-m)]',
				],
				floating: [
					'top-0',
					'-translate-y-[50%]',
					'scale-75',
					'text-[var(--font-size-label-m)]',
					'px-[var(--spacing-xs)]',
				],
			},
		},
		defaultVariants: {
			state: 'default',
			position: 'placeholder',
		},
	},
)

const inputWrapperVariants = cva(
	// Wrapper for input to handle padding
	['w-full h-full', 'flex items-center', 'px-[var(--spacing-md)]'],
)

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
	required?: boolean
	error?: boolean
	errorMessage?: string
	supportingText?: string
}

export const CoTextField = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			label,
			placeholder,
			required = false,
			error = false,
			errorMessage,
			supportingText,
			disabled = false,
			onFocus,
			onBlur,
			onMouseEnter,
			onMouseLeave,
			id,
			...props
		},
		ref,
	) => {
		const [isFocused, setIsFocused] = useState(false)
		const [hasValue, setHasValue] = useState(false)
		const [isHovered, setIsHovered] = useState(false)
		const inputRef = useRef<HTMLInputElement>(null)

		// Generate ID if not provided
		const generatedId = useId()
		const inputId = id || generatedId

		// Combine refs
		const combinedRef = (instance: HTMLInputElement | null) => {
			inputRef.current = instance
			if (typeof ref === 'function') {
				ref(instance)
			} else if (ref) {
				ref.current = instance
			}
		}

		// Check if input has value on mount
		useEffect(() => {
			if (inputRef.current) {
				setHasValue(!!inputRef.current.value)
			}
		}, [])

		// Update hasValue when controlled value changes
		useEffect(() => {
			setHasValue(!!props.value)
		}, [props.value])

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			if (!disabled) {
				setIsFocused(true)
				onFocus?.(e)
			}
		}

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false)
			setHasValue(!!e.target.value)
			onBlur?.(e)
		}

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setHasValue(!!e.target.value)
			props.onChange?.(e)
		}

		const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
			if (!disabled) {
				setIsHovered(true)
				onMouseEnter?.(e as any)
			}
		}

		const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
			setIsHovered(false)
			onMouseLeave?.(e as any)
		}

		const handleContainerClick = () => {
			if (!disabled) {
				inputRef.current?.focus()
			}
		}

		const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			// Handle Enter and Space key presses like a click
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				inputRef.current?.focus()
			}
		}

		// Add keyboard event handler for accessibility
		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			// Focus input when Enter or Space is pressed
			if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
				e.preventDefault()
				inputRef.current?.focus()
			}
		}

		// Determine states
		const isFloating = isFocused || hasValue
		const fieldsetState =
			error && hasValue
				? 'error'
				: isFocused
					? 'focused'
					: isHovered
						? 'hover'
						: 'default'
		const labelState =
			error && hasValue ? 'error' : isFocused ? 'focused' : 'default'
		const labelPosition = isFloating ? 'floating' : 'placeholder'

		// Only show placeholder when label is floating
		const showPlaceholder = isFloating && placeholder

		return (
			<div className='flex flex-col gap-[var(--spacing-xs)]'>
				{/* 
					Container is no longer interactive for accessibility.
					All focus/interaction is handled by the input itself.
				*/}
				<div
					className={[containerVariants({ disabled }), className]
						.filter(Boolean)
						.join(' ')}
					aria-disabled={disabled || undefined}
				>
					{/* Fieldset with legend for border gap */}
					<fieldset className={fieldsetVariants({ state: fieldsetState })}>
						<legend
							className={legendVariants({ hasFloatingLabel: isFloating })}
						>
							{/* Invisible text to maintain gap size */}
							{label && isFloating && (
								<span className='invisible'>
									{label}
									{required && '*'}
								</span>
							)}
						</legend>
					</fieldset>

					{/* Floating label */}
					{label && (
						<label
							className={labelVariants({
								state: labelState,
								position: labelPosition,
							})}
							htmlFor={inputId}
						>
							{label}
							{required && ' *'}
						</label>
					)}

					{/* Input wrapper */}
					<div className={inputWrapperVariants()}>
						<input
							{...props}
							id={inputId}
							ref={combinedRef}
							type={type}
							disabled={disabled}
							placeholder={showPlaceholder ? placeholder : undefined}
							onFocus={handleFocus}
							onBlur={handleBlur}
							onChange={handleChange}
							className={[
								// Input field styles
								'w-full bg-transparent border-0 outline-none',
								'text-[var(--font-size-body-m)]',
								'text-[var(--on-surface)]',
								'placeholder:text-[var(--on-surface-variant)]',
								'placeholder:opacity-70',
								// Add top padding when label is floating
								isFloating ? 'pt-[var(--spacing-sm)]' : '',
								// Disabled styles
								disabled
									? 'text-[var(--on-surface-variant)] cursor-not-allowed pointer-events-none'
									: '',
							]
								.filter(Boolean)
								.join(' ')}
							aria-describedby={
								error
									? `${inputId}-error`
									: supportingText
										? `${inputId}-support`
										: undefined
							}
							aria-invalid={error}
							aria-required={required}
						/>

						{/* Error icon */}
						{error && hasValue && (
							<div className='flex-shrink-0 ms-[var(--spacing-sm)]'>
								<svg
									width='20'
									height='20'
									viewBox='0 0 24 24'
									fill='none'
									className='text-[var(--error)]'
									aria-label='Error'
									role='img'
								>
									<title>Error indicator</title>
									<circle
										cx='12'
										cy='12'
										r='10'
										stroke='currentColor'
										strokeWidth='2'
									/>
									<path d='m15 9-6 6' stroke='currentColor' strokeWidth='2' />
									<path d='m9 9 6 6' stroke='currentColor' strokeWidth='2' />
								</svg>
							</div>
						)}
					</div>
				</div>

				{/* Supporting text */}
				{(error ? errorMessage : supportingText) && (
					<p
						id={error ? `${inputId}-error` : `${inputId}-support`}
						className={[
							'text-[var(--font-size-label-m)]',
							'px-[var(--spacing-md)]',
							error
								? 'text-[var(--error)]'
								: 'text-[var(--on-surface-variant)]',
						].join(' ')}
					>
						{error ? errorMessage : supportingText}
					</p>
				)}
			</div>
		)
	},
)

CoTextField.displayName = 'CoTextField'
