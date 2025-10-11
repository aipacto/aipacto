import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// Use relative URL in development (proxied), absolute URL in production
const API_BASE_URL = process.env.VITE_SERVER_URL ?? ''

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
	initialContent?: string
}

class ServerApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = 'ServerApiError'
	}
}

function buildApiHeaders(init?: RequestInit) {
	const headers = new Headers(init?.headers)
	const request = getRequest()

	if (request) {
		// Forward cookies from SSR request to backend API
		const cookieHeader = request.headers.get('cookie')
		if (cookieHeader && !headers.has('cookie')) {
			headers.set('cookie', cookieHeader)
		}
	}

	if (init?.body && !headers.has('content-type')) {
		headers.set('content-type', 'application/json')
	}

	headers.set('accept', 'application/json')

	return headers
}

async function fetchFromServer(path: string, init?: RequestInit) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		credentials: 'include',
		...init,
		headers: buildApiHeaders(init),
	})

	if (!response.ok) {
		const errorBody = await response.text().catch(() => undefined)
		throw new ServerApiError(
			`Request to ${path} failed with ${response.status}. ${errorBody ?? 'No response body.'}`,
			response.status,
		)
	}

	return response
}

export const getDocuments = createServerFn({ method: 'GET' }).handler(
	async () => {
		const response = await fetchFromServer('/v1/docs')
		const { documents } = (await response.json()) as DocumentsResponse
		return documents
	},
)

export const createDocument = createServerFn({ method: 'POST' })
	.inputValidator((data: CreateDocumentBody) => data)
	.handler(async ({ data }) => {
		const response = await fetchFromServer('/v1/docs', {
			method: 'POST',
			body: JSON.stringify(data),
		})

		return response.json()
	})

export const deleteDocument = createServerFn({ method: 'POST' })
	.inputValidator((docId: string) => docId)
	.handler(async ({ data: docId }) => {
		const response = await fetchFromServer(`/v1/docs/${docId}`, {
			method: 'DELETE',
		})

		return response.json()
	})
