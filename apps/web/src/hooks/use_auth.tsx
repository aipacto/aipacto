import { createAuthClient } from 'better-auth/react'
import { createContext, type ReactNode, useContext } from 'react'

// Determine absolute base for SSR and appropriate base for browser
const isServer = typeof window === 'undefined'

// For SSR (Node), we must use an absolute URL in Docker/Prod. In Vite dev, keep it relative
// to avoid Nitro dev fetch quirks with Request objects.
const SSR_ORIGIN = isServer
	? process.env.SERVER_URL ||
		process.env.VITE_SERVER_URL ||
		(import.meta.env.DEV ? undefined : 'http://localhost:3000')
	: undefined

// For the browser, prefer the build-time Vite var; in dev fallback to window.origin
// so requests go through the Vite proxy and base is always absolute.
const BROWSER_ORIGIN = !isServer
	? import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? window.location.origin : undefined)
	: undefined

const EFFECTIVE_ORIGIN = SSR_ORIGIN ?? BROWSER_ORIGIN

// Ensure we pass an absolute base during SSR; in the browser a relative path is fine when
// no VITE_SERVER_URL is configured (dev with Vite proxy).
const baseURL = EFFECTIVE_ORIGIN
	? `${EFFECTIVE_ORIGIN.replace(/\/$/, '')}/auth`
	: '/auth'

type AuthClient = ReturnType<typeof createAuthClient>

// Avoid instantiating the Better Auth client during SSR to prevent Nitro dev issues
const authClient: AuthClient | null = isServer
	? null
	: createAuthClient({
			baseURL,
			// No custom fetchOptions needed, Better Auth handles httpOnly cookies
		})

// Safe SSR stub so components can render on the server without triggering network calls
const ssrClientStub = {
	signIn: {
		email: async () => ({
			data: null,
			error: new Error('Auth not available on server'),
		}),
	},
	signOut: async () => {},
	getSession: async () => null,
	useSession: (() => ({
		isPending: false,
		data: null,
		error: null,
	})) as AuthClient['useSession'],
} as unknown as AuthClient

const clientOrStub = (authClient ?? ssrClientStub) as AuthClient

interface AuthContextType {
	authClient: AuthClient
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	return (
		<AuthContext.Provider value={{ authClient: clientOrStub }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

export const signIn: AuthClient['signIn'] = clientOrStub.signIn
export const signOut: AuthClient['signOut'] = clientOrStub.signOut
export const useSession: AuthClient['useSession'] = clientOrStub.useSession
export const getSession: AuthClient['getSession'] = clientOrStub.getSession
