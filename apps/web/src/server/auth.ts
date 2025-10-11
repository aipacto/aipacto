import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { Either, Schema as S } from 'effect'

// Use relative URL in development (proxied), absolute URL in production
const AUTH_BASE_URL = process.env.VITE_SERVER_URL
	? `${process.env.VITE_SERVER_URL}/auth`
	: '/auth'

/**
 * Session data schema
 */
export const SessionData = S.Struct({
	session: S.Struct({
		id: S.String,
		token: S.String,
		userId: S.String,
		createdAt: S.String,
		updatedAt: S.String,
		expiresAt: S.String,
		ipAddress: S.optional(S.String),
		userAgent: S.optional(S.String),
	}),
	user: S.Struct({
		id: S.String,
		email: S.String,
		name: S.String,
		image: S.optional(S.NullOr(S.String)),
		emailVerified: S.Boolean,
	}),
})

/**
 * Gets the current session server-side by forwarding cookies to the auth API.
 * This should only be called from route loaders/beforeLoad hooks.
 */
export const getServerAuthState = createServerFn({ method: 'GET' }).handler(
	async () => {
		const request = getRequest()

		// Forward cookies from the SSR request to the auth API
		const headers: HeadersInit = {
			accept: 'application/json',
		}

		if (request) {
			const cookieHeader = request.headers.get('cookie')
			if (cookieHeader) {
				headers.cookie = cookieHeader
			}
			headers['user-agent'] = request.headers.get('user-agent') ?? 'unknown' // Forward UA
			headers['x-forwarded-for'] =
				request.headers.get('x-forwarded-for') ??
				request.headers.get('x-real-ip') ??
				'' // Forward IP
		}

		try {
			const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
				method: 'GET',
				headers,
				credentials: 'include',
			})

			if (!response.ok) {
				// Not authenticated
				return null
			}

			// Decode the response body https://www.better-auth.com/docs/concepts/database into the SessionData schema
			const data = S.decodeUnknownEither(SessionData)(await response.json())

			return Either.isRight(data) ? data.right : null
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: <explanation>
			console.error('getServerAuthState error:', error)
			return null
		}
	},
)
