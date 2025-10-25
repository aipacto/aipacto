import { Effect } from 'effect'
import { LoroDoc } from 'loro-crdt'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
	createLoroDocumentConnector,
	type HistoryResult,
	type LoadDocumentResult,
	type SelectionsResult,
	type SyncResult,
} from '~lib'

interface UseLoroSyncOptions {
	documentId: string
	authToken: string
	onError?: (error: Error) => void
	debounceMs?: number
	enabled?: boolean
}

export interface LoroSyncState {
	isLoading: boolean
	isSyncing: boolean
	lastSyncedAt?: Date
	history: DocumentVersion[]
	activeUsers: Map<string, UserPresence>
	error?: Error | null
	isInitialized: boolean
}

export interface DocumentVersion {
	id: string
	version: any
	timestamp: number
	author: string
	message?: string
}

interface UserPresence {
	userId: string
	name?: string
	selection?: any
	color?: string
}

/**
 * Hook for syncing Loro documents with the server
 *
 * Usage with Better Auth:
 * ```tsx
 * const { data: session } = useSession()
 * const { state, handleDocumentChange } = useLoroSync({
 *   documentId: 'doc-123',
 *   authToken: session?.session?.token || '',
 *   onError: (error) => console.error('Sync error:', error),
 *   enabled: Boolean(session?.session?.token)
 * })
 * ```
 */
export function useLoroSync({
	documentId,
	authToken,
	onError,
	debounceMs = 500,
	enabled = true,
}: UseLoroSyncOptions) {
	const [state, setState] = useState<LoroSyncState>({
		isLoading: true,
		isSyncing: false,
		history: [],
		activeUsers: new Map(),
		isInitialized: false,
	})

	const loroDocRef = useRef<LoroDoc | null>(null)
	const connectorRef = useRef(createLoroDocumentConnector(authToken))
	const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const selectionsIntervalRef = useRef<NodeJS.Timeout | null>(null)

	// Update connector when auth token changes
	useEffect(() => {
		if (authToken && enabled) {
			connectorRef.current = createLoroDocumentConnector(authToken)
		}
	}, [authToken, enabled])

	// Initialize and load document
	useEffect(() => {
		// Skip if not enabled or no auth token
		if (!enabled || !authToken) {
			setState(prev => ({
				...prev,
				isLoading: false,
				error: null,
				isInitialized: false,
			}))
			return
		}

		const loadDocument = async () => {
			try {
				setState(prev => ({ ...prev, isLoading: true, error: null }))

				const loadResult = (await Effect.runPromise(
					connectorRef.current.loadDocument(documentId),
				)) as LoadDocumentResult

				if (loadResult.exists && loadResult.snapshot) {
					// Document exists, load from snapshot
					const loroDoc = new LoroDoc()
					loroDoc.setPeerId(Number(documentId))

					const snapshotData = Uint8Array.from(atob(loadResult.snapshot), c =>
						c.charCodeAt(0),
					)
					loroDoc.import(snapshotData)

					loroDocRef.current = loroDoc
				} else {
					// New document
					const loroDoc = new LoroDoc()
					loroDoc.setPeerId(Number(documentId))
					loroDocRef.current = loroDoc
				}

				setState(prev => ({
					...prev,
					isLoading: false,
					isInitialized: true,
				}))
			} catch (error) {
				const err = error as Error
				setState(prev => ({
					...prev,
					isLoading: false,
					error: err,
					isInitialized: false,
				}))
				onError?.(err)
			}
		}

		loadDocument()
	}, [documentId, authToken, enabled, onError])

	// Sync document to server
	const syncDocument = useCallback(
		async (fromVersion?: any) => {
			if (!loroDocRef.current || state.isSyncing || !enabled || !authToken)
				return

			setState(prev => ({ ...prev, isSyncing: true }))

			try {
				// Generate update
				const update = loroDocRef.current.export({
					mode: 'update',
					from: fromVersion,
				})

				const syncResult = (await Effect.runPromise(
					connectorRef.current.syncDocument(documentId, update, fromVersion),
				)) as SyncResult

				// Apply any updates from server
				if (syncResult.updates) {
					const updateData = Uint8Array.from(atob(syncResult.updates), c =>
						c.charCodeAt(0),
					)
					loroDocRef.current.import(updateData)
				}

				setState(prev => ({
					...prev,
					isSyncing: false,
					lastSyncedAt: new Date(),
				}))
			} catch (error) {
				setState(prev => ({ ...prev, isSyncing: false }))
				onError?.(error as Error)
			}
		},
		[documentId, state.isSyncing, enabled, authToken, onError],
	)

	// Handle document change from Tiptap
	const handleDocumentChange = useCallback(
		(htmlContent: string) => {
			if (!loroDocRef.current || !enabled || !authToken) return

			try {
				// Update Loro document with HTML content
				const documentMap = loroDocRef.current.getMap('document')
				let contentText = documentMap.get('content')

				if (!contentText || typeof contentText === 'string') {
					contentText = loroDocRef.current.getText('content')
					documentMap.setContainer('content', contentText as any)
				}

				;(contentText as any).update(htmlContent)
				loroDocRef.current.commit()

				// Debounced sync
				if (syncTimeoutRef.current) {
					clearTimeout(syncTimeoutRef.current)
				}

				syncTimeoutRef.current = setTimeout(() => {
					syncDocument()
				}, debounceMs)
			} catch (error) {
				onError?.(error as Error)
			}
		},
		[syncDocument, debounceMs, enabled, authToken, onError],
	)

	// Handle selection change
	const handleSelectionChange = useCallback(
		async (selection: any) => {
			if (!enabled || !authToken) return

			try {
				await Effect.runPromise(
					connectorRef.current.updateSelection(documentId, selection),
				)
			} catch (_error) {}
		},
		[documentId, enabled, authToken],
	)

	// Load document history
	const loadHistory = useCallback(async () => {
		if (!enabled || !authToken) return

		try {
			const historyResult = (await Effect.runPromise(
				connectorRef.current.getHistory(documentId),
			)) as HistoryResult
			setState(prev => ({ ...prev, history: historyResult.history }))
		} catch (error) {
			onError?.(error as Error)
		}
	}, [documentId, enabled, authToken, onError])

	// Checkout specific version
	const checkoutVersion = useCallback(
		async (version: any) => {
			if (!enabled || !authToken) {
				throw new Error('Cannot checkout version: not authenticated')
			}

			try {
				await Effect.runPromise(
					connectorRef.current.checkoutVersion(documentId, version),
				)

				// Reload document
				const loadResult = (await Effect.runPromise(
					connectorRef.current.loadDocument(documentId),
				)) as LoadDocumentResult

				if (loadResult.exists && loadResult.snapshot && loroDocRef.current) {
					const snapshotData = Uint8Array.from(atob(loadResult.snapshot), c =>
						c.charCodeAt(0),
					)
					loroDocRef.current.import(snapshotData)

					// Get HTML content from Loro document
					const documentMap = loroDocRef.current.getMap('document')
					const contentText = documentMap.get('content')
					const htmlContent = contentText ? contentText.toString() : ''

					return htmlContent
				}

				throw new Error('Failed to checkout version')
			} catch (error) {
				onError?.(error as Error)
				throw error
			}
		},
		[documentId, enabled, authToken, onError],
	)

	// Create snapshot
	const createSnapshot = useCallback(
		async (message?: string) => {
			if (!enabled || !authToken) return

			try {
				await Effect.runPromise(
					connectorRef.current.createSnapshot(documentId, message),
				)
				await loadHistory()
			} catch (error) {
				onError?.(error as Error)
			}
		},
		[documentId, loadHistory, enabled, authToken, onError],
	)

	// Poll for active selections
	useEffect(() => {
		if (!enabled || !authToken) {
			// Clean up interval if disabled
			if (selectionsIntervalRef.current) {
				clearInterval(selectionsIntervalRef.current)
				selectionsIntervalRef.current = null
			}
			return
		}

		const pollSelections = async () => {
			try {
				const selectionsResult = (await Effect.runPromise(
					connectorRef.current.getSelections(documentId),
				)) as SelectionsResult

				setState(prev => {
					const users = new Map<string, UserPresence>()
					for (const [userId, selection] of Object.entries(
						selectionsResult.selections,
					)) {
						users.set(userId, {
							userId,
							selection,
						})
					}
					return { ...prev, activeUsers: users }
				})
			} catch (_error) {}
		}

		const interval = setInterval(pollSelections, 3000)
		selectionsIntervalRef.current = interval

		return () => {
			if (selectionsIntervalRef.current) {
				clearInterval(selectionsIntervalRef.current)
				selectionsIntervalRef.current = null
			}
		}
	}, [documentId, enabled, authToken])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current)
			}
			if (selectionsIntervalRef.current) {
				clearInterval(selectionsIntervalRef.current)
			}
		}
	}, [])

	// Get current document as HTML content
	const getCurrentDocument = useCallback((): string | null => {
		if (!loroDocRef.current || !state.isInitialized) return null

		const documentMap = loroDocRef.current.getMap('document')
		const contentText = documentMap.get('content')
		return contentText ? (contentText as any).toString() : ''
	}, [state.isInitialized])

	return {
		state,
		handleDocumentChange,
		handleSelectionChange,
		loadHistory,
		checkoutVersion,
		createSnapshot,
		syncDocument,
		getCurrentDocument,
		loroDoc: loroDocRef.current,
		isAuthenticated: Boolean(authToken && enabled),
	}
}
