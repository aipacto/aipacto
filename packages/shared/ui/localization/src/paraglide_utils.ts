import {
	locales as availableLanguageTags,
	type Locale,
	cookieName as paraglideCookieName,
} from './paraglide/runtime'

export const DEFAULT_LANGUAGE: Locale = 'eng'

// Map ISO 639-1 (browser) to your custom codes
const BROWSER_TO_CUSTOM_CODE_MAP: Record<string, Locale> = {
	en: 'eng',
	es: 'spa',
	ca: 'cat',
}

// Map your custom codes to ISO 639-1 (for HTML lang attribute)
const CUSTOM_TO_ISO_MAP: Record<Locale, string> = {
	eng: 'en',
	spa: 'es',
	cat: 'ca',
}

const isSupportedLanguage = (
	language: string | null | undefined,
): language is Locale => {
	if (!language) return false
	return availableLanguageTags.includes(language.trim() as any)
}

export const detectBrowserLanguage = (): Locale => {
	try {
		if (typeof navigator !== 'undefined' && navigator.language) {
			const webLang = navigator.language.split('-')[0]?.toLowerCase()
			const mapped = BROWSER_TO_CUSTOM_CODE_MAP[webLang!]
			if (mapped && isSupportedLanguage(mapped)) {
				return mapped
			}
		}
	} catch (_error) {
		return DEFAULT_LANGUAGE
	}
	return DEFAULT_LANGUAGE
}

export const parseAcceptLanguage = (acceptLanguage: string | null): Locale => {
	if (!acceptLanguage) return DEFAULT_LANGUAGE

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
		const mapped = BROWSER_TO_CUSTOM_CODE_MAP[tag!]
		if (mapped && isSupportedLanguage(mapped)) {
			return mapped
		}
	}

	return DEFAULT_LANGUAGE
}

export const readLanguageFromHtmlLangAttribute = (): Locale => {
	// HTML uses ISO 639-1, so map it back to your custom codes
	const htmlLang = document.documentElement.lang
	const mapped = BROWSER_TO_CUSTOM_CODE_MAP[htmlLang]
	if (mapped && isSupportedLanguage(mapped)) {
		return mapped
	}
	return DEFAULT_LANGUAGE
}

// Helper to get ISO code for HTML lang attribute
export const getIsoLanguageCode = (language: Locale): string => {
	return CUSTOM_TO_ISO_MAP[language] || 'en'
}

/**
 * Reads the Paraglide locale from a cookie string (browser or request header).
 */
export const readLanguageFromCookieString = (
	cookieString: string | null | undefined,
): Locale | undefined => {
	if (!cookieString) {
		return undefined
	}

	const cookies = cookieString.split(';')
	for (const cookie of cookies) {
		const [rawName, rawValue] = cookie.split('=')
		if (!rawName || !rawValue) {
			continue
		}

		if (rawName.trim() !== paraglideCookieName) {
			continue
		}

		const value = decodeURIComponent(rawValue.trim())
		if (isSupportedLanguage(value)) {
			return value
		}
	}

	return undefined
}

/**
 * Gets the user's preferred language from metadata
 */
export const getPreferredLanguage = (
	userMetadata?: Record<string, unknown> | null,
): Locale | 'auto' => {
	if (!userMetadata) {
		return 'auto'
	}

	// Check direct language property
	const directLanguage = userMetadata.language as string | undefined
	if (directLanguage === 'auto') {
		return 'auto'
	}
	if (directLanguage && isSupportedLanguage(directLanguage)) {
		return directLanguage
	}

	// Check publicMetadata
	const publicMetadata = userMetadata.public_metadata as
		| Record<string, unknown>
		| undefined
	const publicLanguage = publicMetadata?.language as string | undefined
	if (publicLanguage === 'auto') {
		return 'auto'
	}
	if (publicLanguage && isSupportedLanguage(publicLanguage)) {
		return publicLanguage
	}

	// Check unsafeMetadata
	const unsafeMetadata = userMetadata.unsafe_metadata as
		| Record<string, unknown>
		| undefined
	const unsafeLanguage = unsafeMetadata?.language as string | undefined
	if (unsafeLanguage === 'auto') {
		return 'auto'
	}
	if (unsafeLanguage && isSupportedLanguage(unsafeLanguage)) {
		return unsafeLanguage
	}

	return 'auto'
}
