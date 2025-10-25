import { Effect } from 'effect'

export interface LoroDocumentConnector {
	loadDocument(documentId: string): Effect.Effect<LoadDocumentResult, Error>
	syncDocument(
		documentId: string,
		update: Uint8Array,
		fromVersion?: any,
	): Effect.Effect<SyncResult, Error>
	updateSelection(
		documentId: string,
		selection: any,
	): Effect.Effect<void, Error>
	getSelections(documentId: string): Effect.Effect<SelectionsResult, Error>
	getHistory(documentId: string): Effect.Effect<HistoryResult, Error>
	checkoutVersion(documentId: string, version: any): Effect.Effect<void, Error>
	createSnapshot(
		documentId: string,
		message?: string,
	): Effect.Effect<void, Error>
}

export interface LoadDocumentResult {
	exists: boolean
	snapshot?: string
}

export interface SyncResult {
	updates?: string
}

export interface SelectionsResult {
	selections: Record<string, any>
}

export interface HistoryResult {
	history: Array<{
		id: string
		version: any
		timestamp: number
		author: string
		message?: string
	}>
}

export function createLoroDocumentConnector(
	authToken: string,
): LoroDocumentConnector {
	return {
		loadDocument: (documentId: string) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}`, {
						headers: {
							Authorization: `Bearer ${authToken}`,
						},
					})
					if (!response.ok) throw new Error('Failed to load document')
					return await response.json()
				},
				catch: error => new Error(`Failed to load document: ${error}`),
			}),

		syncDocument: (
			documentId: string,
			update: Uint8Array,
			_fromVersion?: any,
		) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}/sync`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${authToken}`,
							'Content-Type': 'application/octet-stream',
						},
						body: update,
					})
					if (!response.ok) throw new Error('Failed to sync document')
					return await response.json()
				},
				catch: error => new Error(`Failed to sync document: ${error}`),
			}),

		updateSelection: (documentId: string, selection: any) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}/selection`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${authToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(selection),
					})
					if (!response.ok) throw new Error('Failed to update selection')
				},
				catch: error => new Error(`Failed to update selection: ${error}`),
			}),

		getSelections: (documentId: string) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(
						`/api/v1/docs/${documentId}/selections`,
						{
							headers: {
								Authorization: `Bearer ${authToken}`,
							},
						},
					)
					if (!response.ok) throw new Error('Failed to get selections')
					return await response.json()
				},
				catch: error => new Error(`Failed to get selections: ${error}`),
			}),

		getHistory: (documentId: string) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}/history`, {
						headers: {
							Authorization: `Bearer ${authToken}`,
						},
					})
					if (!response.ok) throw new Error('Failed to get history')
					return await response.json()
				},
				catch: error => new Error(`Failed to get history: ${error}`),
			}),

		checkoutVersion: (documentId: string, version: any) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}/checkout`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${authToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ version }),
					})
					if (!response.ok) throw new Error('Failed to checkout version')
				},
				catch: error => new Error(`Failed to checkout version: ${error}`),
			}),

		createSnapshot: (documentId: string, message?: string) =>
			Effect.tryPromise({
				try: async () => {
					const response = await fetch(`/api/v1/docs/${documentId}/snapshot`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${authToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ message }),
					})
					if (!response.ok) throw new Error('Failed to create snapshot')
				},
				catch: error => new Error(`Failed to create snapshot: ${error}`),
			}),
	}
}
