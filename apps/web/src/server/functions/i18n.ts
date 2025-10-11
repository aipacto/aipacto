import { ListSupportedLanguagesCodes } from '@aipacto/shared-domain'
import { parseAcceptLanguage } from '@aipacto/shared-ui-localization'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const LANGUAGE_COOKIE = 'preferred_language'

/**
 * Detects language from cookie or Accept-Language header
 */
export const detectServerLanguage = createServerFn({
	method: 'GET',
}).handler(async () => {
	const request = getRequest()
	if (!request) return ListSupportedLanguagesCodes.eng

	// Check cookie first
	const cookieHeader = request.headers.get('cookie')
	if (cookieHeader) {
		const cookies = Object.fromEntries(
			cookieHeader.split('; ').map(c => c.split('=')),
		)
		const savedLanguage = cookies[LANGUAGE_COOKIE]
		if (
			savedLanguage &&
			Object.values(ListSupportedLanguagesCodes).includes(
				savedLanguage as ListSupportedLanguagesCodes,
			)
		) {
			return savedLanguage as ListSupportedLanguagesCodes
		}
	}

	// Fall back to Accept-Language header
	const acceptLanguage = request.headers.get('accept-language')
	return parseAcceptLanguage(acceptLanguage)
})

/**
 * Saves language preference to cookie
 */
export const saveLanguagePreference = createServerFn({ method: 'POST' })
	.inputValidator((language: ListSupportedLanguagesCodes) => language)
	.handler(async ({ data: language }) => {
		const request = getRequest()
		if (!request) return
	})
