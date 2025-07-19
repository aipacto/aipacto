import { createAuthClient } from 'better-auth/react'
import { createContext, type ReactNode, useContext } from 'react'

const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	fetchOptions: {
		onSuccess: ctx => {
			const authToken = ctx.response.headers.get('set-auth-token')
			// Store the token securely in localStorage
			if (authToken) {
				localStorage.setItem('bearer_token', authToken)
			}
		},
		auth: {
			type: 'Bearer',
			token: () => localStorage.getItem('bearer_token') || '',
		},
	},
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

// Helper function to get the current Bearer token
export const getBearerToken = (): string | null => {
	return localStorage.getItem('bearer_token')
}

// Helper function to clear the Bearer token
export const clearBearerToken = (): void => {
	localStorage.removeItem('bearer_token')
}

// Helper function to get WebSocket URL without embedding a bearer token (cookies will be sent automatically)
export const getWebSocketUrl = (baseUrl: string, path: string): string => {
	return `${baseUrl.replace('http', 'ws')}${path}`
}
