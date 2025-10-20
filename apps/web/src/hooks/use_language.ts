import type { Locale } from '@aipacto/shared-ui-localization/paraglide/runtime'
import {
	getLocale,
	setLocale,
} from '@aipacto/shared-ui-localization/paraglide/runtime'

export const useLanguage = () => {
	// Use Paraglide's getLocale() to get the current locale
	const language = getLocale()

	const changeLanguage = (newLanguage: Locale) => {
		// Paraglide handles persistence automatically
		setLocale(newLanguage, { reload: true })
	}

	return { language, changeLanguage }
}
