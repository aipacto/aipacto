import { createClient } from '@libsql/client'
import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
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

export const auth = betterAuth({
	database: {
		dialect: new LibSQLDialect({
			client: createClient(dialectConfig),
		}),
		type: 'sqlite',
	},
	plugins: [bearer()],

	// Email and password authentication
	emailAndPassword: {
		enabled: true,
		autoSignIn: true, // Automatically sign in after registration
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
	// Add trusted origins for CORS
	trustedOrigins:
		process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [],
}) as ReturnType<typeof betterAuth>
