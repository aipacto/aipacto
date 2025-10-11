import { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import { changeLanguage } from '@aipacto/shared-ui-localization'
import { Select } from '@base-ui-components/react/select'
import { useRouter } from '@tanstack/react-router'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function CoLanguageSelector() {
	const { t, i18n } = useTranslation()
	const router = useRouter()
	// Default to 'auto' if no specific language is set
	const currentLanguage =
		(i18n.language as ListSupportedLanguagesCodes) || 'auto'

	const languageOptions = [
		{
			value: 'auto' as const,
			label: t('components.co_language_selector.automatic'),
		},
		{
			value: ListSupportedLanguagesCodes.eng,
			label: t('components.co_language_selector.english'),
		},
		{
			value: ListSupportedLanguagesCodes.spa,
			label: t('components.co_language_selector.spanish'),
		},
		{
			value: ListSupportedLanguagesCodes.cat,
			label: t('components.co_language_selector.catalan'),
		},
	]

	const handleLanguageChange = async (
		value: ListSupportedLanguagesCodes | 'auto',
	) => {
		if (value === 'auto') {
			// Handle automatic language detection
			router.invalidate()
		} else {
			await changeLanguage(i18n, value)
			// Optionally save to server/cookie
			// Invalidate router to re-fetch with new language
			router.invalidate()
		}
	}

	return (
		<Select.Root
			items={languageOptions}
			value={currentLanguage}
			onValueChange={value =>
				handleLanguageChange(value as ListSupportedLanguagesCodes | 'auto')
			}
		>
			<Select.Trigger
				className='
					inline-flex items-center justify-between gap-[var(--spacing-sm)]
					ps-[var(--spacing-md)] pe-[var(--spacing-md)] py-[var(--spacing-sm)]
					bg-[var(--surface-container)] text-[var(--on-surface)]
					border border-[var(--outline)]
					rounded-[var(--radius-md)]
					text-[var(--font-size-label-l)]
					hover:bg-[var(--surface-container-high)]
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
					transition-colors
				'
			>
				<Languages className='w-4 h-4 shrink-0' />
				<Select.Value />
				<Select.Icon>
					<ChevronDown className='w-4 h-4 shrink-0' />
				</Select.Icon>
			</Select.Trigger>

			<Select.Portal>
				<Select.Positioner sideOffset={8}>
					<Select.Popup
						className='
							min-w-[180px]
							bg-[var(--surface-container)]
							border border-[var(--outline-variant)]
							rounded-[var(--radius-md)]
							shadow-[var(--layout-shadow-elevation-lg)]
							overflow-hidden
						'
					>
						<Select.List className='p-[var(--spacing-xs)]'>
							{languageOptions.map(({ value, label }) => (
								<Select.Item
									key={value}
									value={value}
									className='
										flex items-center gap-[var(--spacing-sm)]
										ps-[var(--spacing-md)] pe-[var(--spacing-md)] py-[var(--spacing-sm)]
										text-[var(--font-size-body-m)]
										rounded-[var(--radius-sm)]
										cursor-pointer
										hover:bg-[var(--surface-container-high)]
										focus-visible:outline-none focus-visible:bg-[var(--surface-container-high)]
										data-[selected]:bg-[var(--primary-container)]
										data-[selected]:text-[var(--on-primary-container)]
									'
								>
									<Select.ItemIndicator className='w-4 h-4 shrink-0'>
										<Check className='w-4 h-4' />
									</Select.ItemIndicator>
									<Select.ItemText className='flex-1'>{label}</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	)
}
