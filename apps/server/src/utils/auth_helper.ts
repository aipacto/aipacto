import { logAppServer } from '@aipacto/shared-utils-logging'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { auth } from './auth'

/**
 * Helper function to convert Fastify headers to standard Headers object
 */
function convertHeaders(
	fastifyHeaders: Record<string, string | string[] | undefined>,
): Headers {
	const headers = new Headers()
	Object.entries(fastifyHeaders).forEach(([key, value]) => {
		if (value) {
			if (Array.isArray(value)) {
				value.forEach(v => headers.append(key, v))
			} else {
				headers.append(key, value)
			}
		}
	})
	return headers
}

/**
 * Authenticate request and add session to request object
 */
export async function authenticateRequest(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<boolean> {
	try {
		// Convert Fastify headers to standard Headers object
		const headers = convertHeaders(request.headers)

		request.log.debug('Authenticating request', {
			url: request.url,
			method: request.method,
			hasCookie: !!headers.get('cookie'),
			cookieLength: headers.get('cookie')?.length || 0,
		})

		const session = await auth.api.getSession({
			headers,
		})

		request.log.debug('Session validation result', {
			hasSession: !!session,
			userId: session?.user?.id,
			sessionKeys: session ? Object.keys(session) : [],
		})

		if (!session) {
			request.log.debug('No valid session found, rejecting request')
			reply.status(401).send({ error: 'Unauthorized' })
			return false
		}
		// Add session data to request for use in handlers
		;(request as any).session = session
		request.log.debug('Authentication successful, session attached to request')
		return true
	} catch (error) {
		request.log.error('Authentication error:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})

		reply.status(401).send({ error: 'Unauthorized' })

		return false
	}
}
