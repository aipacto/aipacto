import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Utility function to create WebSocket URLs for real-time collaboration
 * Handles both development (proxied) and production environments
 *
 * @param baseUrl - The base URL of the server (e.g., 'http://localhost:3000' or 'https://api.example.com')
 * @param path - The WebSocket path (e.g., '/v1/docs/123/sync')
 * @returns The complete WebSocket URL (e.g., 'ws://localhost:3001/v1/docs/123/sync' in dev, 'wss://api.example.com/v1/docs/123/sync' in prod)
 *
 * @example
 * ```typescript
 * // In development (uses Vite proxy)
 * getWebSocketUrl('http://localhost:3000', '/v1/docs/123/sync')
 * // Returns: 'ws://localhost:3001/v1/docs/123/sync'
 *
 * // In production
 * getWebSocketUrl('https://api.example.com', '/v1/docs/123/sync')
 * // Returns: 'wss://api.example.com/v1/docs/123/sync'
 * ```
 */
export function getWebSocketUrl(baseUrl: string, path: string): string {
	// In development, use the same origin and let Vite proxy handle the WebSocket
	if (import.meta.env.DEV) {
		// Use the current origin (localhost:3001 in dev) and let Vite proxy to backend
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
		return `${protocol}//${window.location.host}${path}`
	}

	// In production, use the provided baseUrl
	// Remove trailing slash from baseUrl if present
	const cleanBaseUrl = baseUrl.replace(/\/$/, '')

	// Remove leading slash from path if present
	const cleanPath = path.replace(/^\//, '')

	// Determine the protocol based on the base URL
	const protocol = cleanBaseUrl.startsWith('https://') ? 'wss://' : 'ws://'

	// Extract host from baseUrl (remove protocol)
	const host = cleanBaseUrl.replace(/^https?:\/\//, '')

	// For production or other environments, use the determined protocol
	return `${protocol}${host}/${cleanPath}`
}

/**
 * Hook for managing WebSocket connections with automatic reconnection
 *
 * @param url - The WebSocket URL to connect to
 * @param options - Configuration options for the WebSocket connection
 * @returns WebSocket management utilities
 */
export function useWebSocket(
	url: string | null,
	options?: {
		onOpen?: (event: Event) => void
		onMessage?: (event: MessageEvent) => void
		onClose?: (event: CloseEvent) => void
		onError?: (event: Event) => void
		reconnectInterval?: number
		maxReconnectAttempts?: number
	},
) {
	const [socket, setSocket] = useState<WebSocket | null>(null)
	const [isConnected, setIsConnected] = useState(false)
	const [reconnectAttempts, setReconnectAttempts] = useState(0)
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const {
		onOpen,
		onMessage,
		onClose,
		onError,
		reconnectInterval = 3000,
		maxReconnectAttempts = 5,
	} = options || {}

	const connect = useCallback(() => {
		if (!url || socket?.readyState === WebSocket.OPEN) return

		try {
			const ws = new WebSocket(url)

			ws.onopen = event => {
				setIsConnected(true)
				setReconnectAttempts(0)
				onOpen?.(event)
			}

			ws.onmessage = event => {
				onMessage?.(event)
			}

			ws.onclose = event => {
				setIsConnected(false)
				onClose?.(event)

				// Attempt to reconnect if not a normal closure
				if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
					reconnectTimeoutRef.current = setTimeout(() => {
						setReconnectAttempts(prev => prev + 1)
						connect()
					}, reconnectInterval)
				}
			}

			ws.onerror = event => {
				onError?.(event)
			}

			setSocket(ws)
		} catch (_error) {}
	}, [
		url,
		socket,
		onOpen,
		onMessage,
		onClose,
		onError,
		reconnectAttempts,
		maxReconnectAttempts,
		reconnectInterval,
	])

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
			reconnectTimeoutRef.current = null
		}

		if (socket) {
			socket.close(1000, 'Manual disconnect')
			setSocket(null)
		}

		setIsConnected(false)
	}, [socket])

	const send = useCallback(
		(data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
			if (socket?.readyState === WebSocket.OPEN) {
				socket.send(data)
			}
		},
		[socket],
	)

	// Connect when URL changes
	useEffect(() => {
		if (url) {
			connect()
		}

		return () => {
			disconnect()
		}
	}, [url, connect, disconnect])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		socket,
		isConnected,
		reconnectAttempts,
		connect,
		disconnect,
		send,
	}
}
