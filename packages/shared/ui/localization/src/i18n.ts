import { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import i18next, { type i18n as I18nInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { detectBrowserLanguage, getPreferredLanguage } from './language_utils'
import { languages } from './languages'

export interface I18nConfig {
	language?: ListSupportedLanguagesCodes
	userMetadata?: Record<string, unknown> | null
}

/**
 * Creates a new i18n instance for SSR
 * Each server request should get its own instance
 */
export const createI18nInstance = (config?: I18nConfig): I18nInstance => {
	const i18n = i18next.createInstance()

	// Determine language
	let language: ListSupportedLanguagesCodes
	if (config?.language) {
		language = config.language
	} else {
		const preferred = getPreferredLanguage(config?.userMetadata)
		language =
			preferred === 'auto'
				? detectBrowserLanguage()
				: (preferred as ListSupportedLanguagesCodes)
	}

	i18n.use(initReactI18next).init({
		resources: languages,
		lng: language,
		fallbackLng: ListSupportedLanguagesCodes.eng,
		defaultNS: 'common',
		interpolation: {
			escapeValue: false,
		},
		react: {
			useSuspense: false, // Critical for SSR
		},
	})

	return i18n
}

/**
 * Change language in an existing i18n instance
 */
export const changeLanguage = (
	i18n: I18nInstance,
	language: ListSupportedLanguagesCodes,
) => {
	return i18n.changeLanguage(language)
}

// Legacy exports for backward compatibility
export const detectLanguage = (): ListSupportedLanguagesCodes => {
	return detectBrowserLanguage()
}

export const initI18n = async (
	userMetadata?: Record<string, unknown> | null,
) => {
	const i18n = createI18nInstance({ userMetadata: userMetadata ?? null })
	await i18n.init()
	return i18n
}
