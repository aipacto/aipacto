import { Effect, Option } from 'effect'
import type { FastifyInstance } from 'fastify'

import { LoroDocumentService } from '../docs/loro'
import { authenticateRequest } from '../utils/auth_helper'
import { RuntimeClient } from '../utils/services' // Assume this is defined elsewhere, e.g., Effect.runtime

interface CreateDocumentBody {
	title: string
	description: string
	path: string
	initialContent?: string // Base64 encoded Uint8Array
}

interface UpdateMetadataBody {
	title?: string
	description?: string
	path?: string
}

export async function routesDocuments(server: FastifyInstance) {
	server.addHook('preHandler', async (request, reply) => {
		// Check if the request URL starts with /v1/docs
		if (!request.url.startsWith('/v1/docs')) {
			return
		}

		const isAuthenticated = await authenticateRequest(request, reply)
		if (!isAuthenticated) {
			return reply
		}
	})

	// Create new document
	server.post<{ Body: CreateDocumentBody }>('/v1/docs', {
		handler: async (request, reply) => {
			const { title, description, path, initialContent } = request.body
			const session = (request as any).session
			const userId = session.user.id
			const documentId = crypto.randomUUID()

			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						// Convert base64 to Uint8Array if provided
						const contentBytes = initialContent
							? Uint8Array.from(Buffer.from(initialContent, 'base64'))
							: undefined

						yield* docService.createDocument(
							documentId,
							title,
							description,
							path,
							userId,
							contentBytes,
						)
						return { documentId, success: true }
					}).pipe(
						Effect.catchAll(error => {
							request.log.error({ error }, 'Create error')
							return Effect.succeed({ success: false, error: error.message })
						}),
					),
				)
				return reply.send(result)
			} catch (error) {
				request.log.error({ error }, 'Failed to create document')
				return reply.status(500).send({ error: 'Failed to create document' })
			}
		},
	})

	// Get document
	server.get<{ Params: { docId: string } }>('/v1/docs/:docId', {
		handler: async (request, reply) => {
			const { docId } = request.params
			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						const docOpt = yield* docService.getDocument(docId)
						if (Option.isNone(docOpt))
							return { success: false, message: 'Not found' }
						return { success: true, document: docOpt.value.toJSON().document }
					}).pipe(
						Effect.catchAll(error => {
							request.log.error({ error }, 'Get error')
							return Effect.succeed({
								success: false,
								error: JSON.stringify(error),
							})
						}),
					),
				)
				return reply.send(result)
			} catch (error) {
				request.log.error({ error }, 'Failed to get document')
				return reply.status(500).send({ error: 'Failed to get document' })
			}
		},
	})

	// Update metadata
	server.put<{ Params: { docId: string }; Body: UpdateMetadataBody }>(
		'/v1/docs/:docId',
		{
			handler: async (request, reply) => {
				const { docId } = request.params
				const { title, description, path } = request.body
				try {
					const result = await RuntimeClient.runPromise(
						Effect.gen(function* () {
							const docService = yield* LoroDocumentService
							yield* docService.updateMetadata(docId, title, description, path)
							return { success: true }
						}).pipe(
							Effect.catchAll(error => {
								request.log.error({ error }, 'Update error')
								return Effect.succeed({ success: false, error: error.message })
							}),
						),
					)
					return reply.send(result)
				} catch (error) {
					request.log.error({ error }, 'Failed to update metadata')
					return reply.status(500).send({ error: 'Failed to update metadata' })
				}
			},
		},
	)

	// Delete document
	server.delete<{ Params: { docId: string } }>('/v1/docs/:docId', {
		handler: async (request, reply) => {
			const { docId } = request.params
			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						yield* docService.deleteDocument(docId)
						return { success: true }
					}).pipe(
						Effect.catchAll(error => {
							request.log.error({ error }, 'Delete error')
							return Effect.succeed({ success: false, error: error.message })
						}),
					),
				)
				return reply.send(result)
			} catch (error) {
				request.log.error({ error }, 'Failed to delete document')
				return reply.status(500).send({ error: 'Failed to delete document' })
			}
		},
	})

	// List documents
	server.get('/v1/docs', {
		handler: async (request, reply) => {
			try {
				const documents = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						const ids = yield* docService.listDocuments()
						const docs = []
						for (const id of ids) {
							const docOpt = yield* docService.getDocument(id)
							if (Option.isSome(docOpt)) {
								docs.push({ id, ...docOpt.value.toJSON().document })
							}
						}
						return docs
					}).pipe(
						Effect.catchAll(error => {
							request.log.error({ error }, 'List error')
							return Effect.succeed([])
						}),
					),
				)
				return reply.send({ documents })
			} catch (error) {
				request.log.error({ error }, 'Failed to list documents')
				return reply.status(500).send({ error: 'Failed to list documents' })
			}
		},
	})

	// WebSocket sync
	server.get(
		'/v1/docs/:docId/sync',
		{ websocket: true },
		async (connection, request) => {
			const { docId } = request.params as { docId: string }
			const session = (request as any).session
			const userId = session.user.id

			const docOpt = await RuntimeClient.runPromise(
				Effect.gen(function* () {
					const docService = yield* LoroDocumentService
					return yield* docService.getDocument(docId)
				}).pipe(
					Effect.catchAll(error => {
						request.log.error({ error }, 'WS get doc error')
						return Effect.succeed(Option.none())
					}),
				),
			)

			if (Option.isNone(docOpt)) {
				connection.close(1008, 'Document not found')
				return
			}

			const serverDoc = docOpt.value
			let isInitialSync = true

			// Subscribe to document updates and forward to client
			const unsubscribe = serverDoc.subscribeLocalUpdates(update => {
				// Don't send back the update that came from this client
				if (!isInitialSync) {
					connection.send(update)
				}
			})

			connection.on('message', async message => {
				if (message instanceof Buffer) {
					try {
						// Apply the update to the server document
						serverDoc.import(new Uint8Array(message))

						// If this is the first message, it's the initial sync
						if (isInitialSync) {
							isInitialSync = false
							// Send back the current state after merging
							const currentState = serverDoc.export({ mode: 'update' })
							connection.send(currentState)
						}

						// Persist the changes
						await RuntimeClient.runPromise(
							Effect.gen(function* () {
								const docService = yield* LoroDocumentService
								yield* docService.applyUpdate(
									docId,
									new Uint8Array(message),
									userId,
								)
							}).pipe(
								Effect.catchAll(error => {
									request.log.error({ error }, 'WS apply update error')
									return Effect.void
								}),
							),
						)
					} catch (error) {
						request.log.error({ error }, 'Failed to process message')
					}
				}
			})

			connection.on('close', () => {
				unsubscribe()
			})
		},
	)
}
