import { createClient } from '@libsql/client'
import { betterAuth } from 'better-auth'
import { LibSQLDialect } from 'kysely-turso/libsql'

// Validate environment variables first
if (process.env.DATABASE_AUTH_URL === undefined)
	throw new Error('DATABASE_AUTH_URL is not set')

if (process.env.DATABASE_AUTH_SECRET === undefined)
	throw new Error('DATABASE_AUTH_SECRET is not set')

// Now we can safely create the config with guaranteed non-undefined values
const dialectConfig = {
	url: process.env.DATABASE_AUTH_URL,
	authToken: process.env.DATABASE_AUTH_SECRET,
} as const

const isProduction = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
	basePath: '/auth',
	database: {
		dialect: new LibSQLDialect({
			client: createClient(dialectConfig),
		}),
		type: 'sqlite',
	},

	// Email and password authentication
	emailAndPassword: {
		enabled: true,
		autoSignIn: true, // Automatically sign in after registration
	},

	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},

	// Add trusted origins for CORS (development only, production uses same domain)
	trustedOrigins:
		process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [],

	// Advanced cookie and security settings
	advanced: {
		cookiePrefix: 'better_auth',
		// Enable subdomain cookies in production (api.aipacto.com → .aipacto.com)
		crossSubDomainCookies: {
			enabled: isProduction,
		},
		// Use secure cookies in production (HTTPS only)
		useSecureCookies: isProduction,
		ipAddress: {
			headers: ['x-forwarded-for', 'x-vercel-forwarded-for', 'x-real-ip'], // Chain of trusted proxies
			disableIpTracking: false,
		},
	},
}) as ReturnType<typeof betterAuth>
