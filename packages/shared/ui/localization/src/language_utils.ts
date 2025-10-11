import {
	isValidDeviceLanguageCode,
	type LanguageDeviceLanguageCode,
	ListSupportedLanguagesCodes,
	ListSupportedLanguagesMapperIso1to3,
} from '@aipacto/shared-domain'
import { logSharedUiLocalization } from '@aipacto/shared-utils-logging'

/**
 * Detects browser language on the client side
 */
export const detectBrowserLanguage =
	(): keyof typeof ListSupportedLanguagesCodes => {
		let deviceLanguage = 'en'

		try {
			if (typeof navigator !== 'undefined' && navigator.language) {
				const webLang = navigator.language.split('-')[0]?.toLowerCase()
				if (webLang) {
					deviceLanguage = webLang
				}
			}
		} catch (error) {
			logSharedUiLocalization.error('Error detecting browser language:', error)
			return ListSupportedLanguagesCodes.eng
		}

		if (isValidDeviceLanguageCode(deviceLanguage)) {
			const mappedLanguage =
				ListSupportedLanguagesMapperIso1to3[
					deviceLanguage as LanguageDeviceLanguageCode
				]
			if (mappedLanguage) {
				return mappedLanguage as keyof typeof ListSupportedLanguagesCodes
			}
		}

		return ListSupportedLanguagesCodes.eng
	}

/**
 * Parses Accept-Language header for server-side language detection
 */
export const parseAcceptLanguage = (
	acceptLanguage: string | null,
): keyof typeof ListSupportedLanguagesCodes => {
	if (!acceptLanguage) {
		return ListSupportedLanguagesCodes.eng
	}

	// Parse Accept-Language: "en-US,en;q=0.9,es;q=0.8"
	const languages = acceptLanguage
		.split(',')
		.map(lang => {
			const [tag, quality = 'q=1'] = lang.trim().split(';')
			return {
				tag: tag?.split('-')[0]?.toLowerCase() || 'en',
				quality: parseFloat(quality.split('=')[1] || '1'),
			}
		})
		.sort((a, b) => b.quality - a.quality)

	for (const { tag } of languages) {
		if (tag && isValidDeviceLanguageCode(tag)) {
			const mapped =
				ListSupportedLanguagesMapperIso1to3[tag as LanguageDeviceLanguageCode]
			if (mapped) {
				return mapped as keyof typeof ListSupportedLanguagesCodes
			}
		}
	}

	return ListSupportedLanguagesCodes.eng
}

/**
 * Gets the user's preferred language from metadata or device
 * Checks both publicMetadata and unsafeMetadata for compatibility
 * @param userMetadata - The user metadata from Clerk or another source
 * @returns A supported language code or 'auto'
 */
export const getPreferredLanguage = (
	userMetadata?: Record<string, unknown> | null,
): keyof typeof ListSupportedLanguagesCodes | 'auto' => {
	if (!userMetadata) {
		return 'auto'
	}

	// Check direct language property
	const directLanguage = userMetadata.language as string | undefined
	if (directLanguage === 'auto') {
		return 'auto'
	}
	if (
		directLanguage &&
		Object.keys(ListSupportedLanguagesCodes).includes(directLanguage)
	) {
		return directLanguage as keyof typeof ListSupportedLanguagesCodes
	}

	// Check publicMetadata
	const publicMetadata = userMetadata.public_metadata as
		| Record<string, unknown>
		| undefined
	const publicLanguage = publicMetadata?.language as string | undefined
	if (publicLanguage === 'auto') {
		return 'auto'
	}
	if (
		publicLanguage &&
		Object.keys(ListSupportedLanguagesCodes).includes(publicLanguage)
	) {
		return publicLanguage as keyof typeof ListSupportedLanguagesCodes
	}

	// Check unsafeMetadata
	const unsafeMetadata = userMetadata.unsafe_metadata as
		| Record<string, unknown>
		| undefined
	const unsafeLanguage = unsafeMetadata?.language as string | undefined
	if (unsafeLanguage === 'auto') {
		return 'auto'
	}
	if (
		unsafeLanguage &&
		Object.keys(ListSupportedLanguagesCodes).includes(unsafeLanguage)
	) {
		return unsafeLanguage as keyof typeof ListSupportedLanguagesCodes
	}

	return 'auto'
}
