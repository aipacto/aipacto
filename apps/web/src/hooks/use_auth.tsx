import { createAuthClient } from 'better-auth/react'
import { createContext, type ReactNode, useContext } from 'react'

// Use relative URL in development (proxied), absolute URL in production
const baseURL = import.meta.env.VITE_SERVER_URL
	? `${import.meta.env.VITE_SERVER_URL}/auth`
	: '/auth'

const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
	baseURL,
	// No custom fetchOptions needed - Better Auth handles httpOnly cookies
})

interface AuthContextType {
	authClient: typeof authClient
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	return (
		<AuthContext.Provider value={{ authClient }}>
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

export const signIn: typeof authClient.signIn = authClient.signIn
export const signOut: typeof authClient.signOut = authClient.signOut
export const useSession: typeof authClient.useSession = authClient.useSession
export const getSession: typeof authClient.getSession = authClient.getSession
