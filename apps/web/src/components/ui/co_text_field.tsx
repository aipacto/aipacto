import { Field } from '@base-ui-components/react/field'
import { Input } from '@base-ui-components/react/input'
import type * as React from 'react'
import { forwardRef } from 'react'

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
	label?: string
	errorMessage?: string
	supportingText?: string
}

export const CoTextField = forwardRef<HTMLInputElement, TextFieldProps>(
	(
		{
			label,
			errorMessage,
			supportingText,
			disabled = false,
			required = false,
			id,
			name,
			...props
		},
		ref,
	) => {
		const fieldName = name ?? id

		return (
			<Field.Root
				{...(fieldName !== undefined ? { name: fieldName } : {})}
				disabled={disabled}
				invalid={!!errorMessage}
				className='flex w-full flex-col items-start gap-[var(--spacing-xs)]'
			>
				{label && (
					<Field.Label
						className={(state) => {
							const isInvalid = state.valid === false || !!errorMessage

							return [
								'text-[var(--font-size-label-l)]',
								'font-medium',
								isInvalid
									? 'text-[var(--error)]'
									: state.disabled
										? 'text-[var(--on-surface-variant)]'
										: 'text-[var(--on-surface)]',
							].join(' ')
						}}
					>
						{label}
					</Field.Label>
				)}

				<Input
					{...props}
					id={id}
					ref={ref}
					required={required}
					className={(state) => {
						const isInvalid = state.valid === false || !!errorMessage
						const isFocused = state.focused && !isInvalid

						return [
							// Base styles
							'box-border w-full',
							'h-[var(--spacing-xxl)]',
							'px-[var(--spacing-md)]',
							'rounded-[var(--radius-md)]',
							'font-[inherit]',
							'text-[var(--font-size-body-m)]',
							// Colors
							'bg-[var(--surface-container)]',
							isInvalid
								? 'text-[var(--error)] border-[var(--error)] border-2'
								: state.disabled
									? 'text-[var(--on-surface-variant)] border-[var(--outline-variant)]'
									: 'text-[var(--on-surface)] border-[var(--outline)]',
							// Border
							isFocused ? 'border-[var(--primary)] border-2' : 'border',
							// Focus
							isFocused
								? 'outline outline-2 -outline-offset-1 outline-[var(--primary)]'
								: 'outline-none',
							// Placeholder
							'placeholder:text-[var(--on-surface-variant)] placeholder:opacity-60',
							// Disabled
							state.disabled ? 'cursor-not-allowed opacity-50' : '',
						].join(' ')
					}}
				/>

				{errorMessage && (
					<Field.Error
						match
						className='text-[var(--font-size-label-m)] text-[var(--error)]'
					>
						{errorMessage}
					</Field.Error>
				)}

				{supportingText && !errorMessage && (
					<Field.Description className='text-[var(--font-size-label-m)] text-[var(--on-surface-variant)]'>
						{supportingText}
					</Field.Description>
				)}
			</Field.Root>
		)
	},
)

CoTextField.displayName = 'CoTextField'
