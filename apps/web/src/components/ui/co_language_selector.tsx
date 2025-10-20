import { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import { DEFAULT_LANGUAGE, readLanguageFromCookieString } from '@aipacto/shared-ui-localization'
import * as m from '@aipacto/shared-ui-localization/paraglide/messages'
import {
	getLocale,
	setLocale,
	type Locale,
} from '@aipacto/shared-ui-localization/paraglide/runtime'
import { Select } from '@base-ui-components/react/select'
import { Check, ChevronDown, Languages } from 'lucide-react'

const SUPPORTED_LANGUAGES = Object.values(ListSupportedLanguagesCodes)

const isSupportedLanguage = (value: string | undefined): value is Locale =>
	value !== undefined &&
	(SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value)

export function CoLanguageSelector() {
	const cookieLanguage =
		typeof document !== 'undefined'
			? readLanguageFromCookieString(document.cookie)
			: undefined

	const resolvedLanguage = cookieLanguage ?? getLocale() ?? DEFAULT_LANGUAGE
	const currentLanguage: Locale =
		isSupportedLanguage(resolvedLanguage) ? resolvedLanguage : DEFAULT_LANGUAGE

	const languageOptions = [
		{
			value: ListSupportedLanguagesCodes.eng,
			label: m.common_components_co_language_selector_english(),
		},
		{
			value: ListSupportedLanguagesCodes.spa,
			label: m.common_components_co_language_selector_spanish(),
		},
		{
			value: ListSupportedLanguagesCodes.cat,
			label: m.common_components_co_language_selector_catalan(),
		},
	]

	const selectedLabel =
		languageOptions.find(opt => opt.value === currentLanguage)?.label || ''

	const handleLanguageChange = (value: ListSupportedLanguagesCodes) => {
		// Paraglide handles persistence and page reload automatically
		setLocale(value, { reload: true })
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
					ps-[var(--spacing-sm)] pe-[var(--spacing-sm)] py-[var(--spacing-xs)]
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
				<Select.Value>{selectedLabel}</Select.Value>
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
