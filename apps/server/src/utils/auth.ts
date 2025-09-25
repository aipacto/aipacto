import { LibsqlDialect } from '@libsql/kysely-libsql'
import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'

// Use Kysely LibSQL dialect for Better Auth (dev: file db, prod: Turso)
// Build dialect config without undefined fields (TS exactOptionalPropertyTypes)
const authDbUrl = process.env.DATABASE_URL || 'file:./app.db'
const dialectConfig: { url: string; authToken?: string } = { url: authDbUrl }
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_TOKEN) {
	dialectConfig.authToken = process.env.DATABASE_TOKEN
}

export const auth = betterAuth({
	database: {
		dialect: new LibsqlDialect(dialectConfig),
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
