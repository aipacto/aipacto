import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import Database from 'better-sqlite3'

// Create SQLite database
const db = new Database('./auth.db')

export const auth = betterAuth({
	database: db,
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
