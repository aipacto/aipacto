import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// ------ Config: API base resolution ------

/**
 * Prefer a runtime env for containers/production (SERVER_URL),
 * else use the Vite build-time var for local dev (VITE_SERVER_URL),
 * and finally fall back to localhost:3000.
 */
const RUNTIME_API_BASE =
	process.env.SERVER_URL ??
	import.meta.env.VITE_SERVER_URL ??
	'http://localhost:3000'

/**
 * If this module were ever executed in the browser (it shouldn't be for server
 * functions), we keep relative paths so Vite's proxy can still work.
 */
const BROWSER_RELATIVE_BASE = ''

function absoluteApi(path: string) {
	return (import.meta.env.SSR ? RUNTIME_API_BASE : BROWSER_RELATIVE_BASE) + path
}

// ------ Types ------

export interface DocumentSummary {
	id: string
	title: string
	description: string
	path: string
	createdAt?: string
	updatedAt?: string
	lastModifiedBy?: string
}

type DocumentsResponse = {
	documents: DocumentSummary[]
}

type CreateDocumentBody = {
	title: string
	description: string
	path: string
	initialContent?: string // base64-encoded Uint8Array
}

type ServerGetDocumentResponse = {
	success: boolean
	document?: {
		id?: string
		title: string
		description: string
		path: string
		createdAt?: string
		updatedAt?: string
		lastModifiedBy?: string
	}
	message?: string
	error?: string
}

// ------ Error helper ------

class ServerApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = 'ServerApiError'
	}
}

// ------ Fetch helpers ------

function buildApiHeaders(init?: RequestInit) {
	const headers = new Headers(init?.headers)
	const request = getRequest()

	// Forward auth cookies from the incoming browser request to the API
	if (request) {
		const cookieHeader = request.headers.get('cookie')
		if (cookieHeader && !headers.has('cookie')) {
			headers.set('cookie', cookieHeader)
		}
	}

	if (init?.body && !headers.has('content-type')) {
		headers.set('content-type', 'application/json')
	}

	// Force JSON responses from API routes (avoid HTML handlers)
	headers.set('accept', 'application/json')

	return headers
}

async function fetchFromServer(path: string, init?: RequestInit) {
	const url = absoluteApi(path)
	const response = await fetch(url, {
		credentials: 'include',
		...init,
		headers: buildApiHeaders(init),
	})

	if (!response.ok) {
		const body = await response.text().catch(() => '')
		throw new ServerApiError(
			`Request to ${path} failed with ${response.status}. ${body || 'No response body.'}`,
			response.status,
		)
	}

	return response
}

// ------ Server functions ------

export const getDocuments = createServerFn({ method: 'GET' }).handler(
	async () => {
		const res = await fetchFromServer('/v1/docs')
		const { documents } = (await res.json()) as DocumentsResponse
		return documents
	},
)

export const getDocument = createServerFn({ method: 'GET' })
	.inputValidator((docId: string) => docId)
	.handler(async ({ data: docId }) => {
		const res = await fetchFromServer(`/v1/docs/${docId}`)
		const json = (await res.json()) as ServerGetDocumentResponse
		if (!json.success || !json.document) {
			throw new ServerApiError(
				`Failed to fetch document ${docId}: ${json.message || json.error || 'Unknown error'}`,
				500,
			)
		}
		return json.document
	})

export const createDocument = createServerFn({ method: 'POST' })
	.inputValidator((data: CreateDocumentBody) => data)
	.handler(async ({ data }) => {
		const res = await fetchFromServer('/v1/docs', {
			method: 'POST',
			body: JSON.stringify(data),
		})
		return res.json()
	})

export const deleteDocument = createServerFn({ method: 'POST' })
	.inputValidator((docId: string) => docId)
	.handler(async ({ data: docId }) => {
		const res = await fetchFromServer(`/v1/docs/${docId}`, { method: 'DELETE' })
		return res.json()
	})
