import { Effect, Option } from 'effect'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Cursor, type Side } from 'loro-crdt'

import { LoroDocumentService } from '../docs/loro'
import { authenticateRequest } from '../utils/auth_helper'
import { RuntimeClient } from '../utils/services'

interface DocumentSyncBody {
	documentId: string
	update?: string // Base64 encoded Loro update
	fromVersion?: any // VersionVector
}

interface SelectionUpdateBody {
	documentId: string
	selection: any
	cursor?: string // Base64 encoded cursor data
}

interface CreateSnapshotBody {
	documentId: string
	message?: string
}

interface CheckoutVersionBody {
	version: any // VersionVector
}

export async function routesDocuments(server: FastifyInstance) {
	server.addHook('preHandler', async (request, reply) => {
		// Skip authentication for test endpoints
		if (request.url.includes('/test-')) {
			return
		}

		const isAuthenticated = await authenticateRequest(request, reply)
		if (!isAuthenticated) {
			return // Reply already sent by authenticateRequest
		}
	})

	// Simple test endpoint to verify authentication is working
	server.get('/documents/test-auth', {
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			const session = (request as any).session
			const result = {
				authenticated: true,
				user: session?.user,
				hasSession: !!session,
				sessionKeys: session ? Object.keys(session) : [],
				headers: request.headers,
				message: 'Authentication working',
			}
			request.log.debug('Auth test response:', JSON.stringify(result, null, 2))
			return reply.send(result)
		},
	})

	// Test endpoint to verify loro-crdt library is working
	server.get('/documents/test-loro', {
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const { LoroDoc } = await import('loro-crdt')
				const doc = new LoroDoc()
				doc.setPeerId(123)
				const version = doc.version()

				return reply.send({
					success: true,
					message: 'loro-crdt library is working',
					version,
				})
			} catch (error) {
				return reply.status(500).send({
					error: 'loro-crdt test failed',
					details: error instanceof Error ? error.message : String(error),
				})
			}
		},
	})

	// Create or sync document
	server.post<{ Body: DocumentSyncBody }>('/documents/sync', {
		handler: async (
			request: FastifyRequest<{ Body: DocumentSyncBody }>,
			reply: FastifyReply,
		) => {
			const { documentId, update, fromVersion } = request.body
			const session = (request as any).session
			const userId = session.user.id

			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* (_) {
						const docService = yield* _(LoroDocumentService)

						// Get or create document
						const docOption = yield* _(docService.getDocument(documentId))

						if (Option.isNone(docOption)) {
							// Create new document
							yield* _(docService.createDocument(documentId))
						}

						// Apply update if provided
						if (update) {
							const updateData = Buffer.from(update, 'base64')
							yield* _(docService.applyUpdate(documentId, updateData, userId))
						}

						// Get updates since client version
						const updates = yield* _(
							docService.getUpdates(documentId, fromVersion),
						)

						// Get current document version
						const currentDoc = yield* _(docService.getDocument(documentId))
						const version = Option.isSome(currentDoc)
							? currentDoc.value.version()
							: null

						return {
							documentId,
							updates: Buffer.from(updates).toString('base64'),
							version,
						}
					}).pipe(
						Effect.catchAll(error => {
							request.log.error('Document sync error:', error)
							return Effect.fail(new Error('Failed to sync document'))
						}),
					),
				)

				return reply.send(result)
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to sync document' })
			}
		},
	})

	// Get document history
	server.get<{ Params: { documentId: string } }>(
		'/documents/:documentId/history',
		{
			handler: async (
				request: FastifyRequest<{ Params: { documentId: string } }>,
				reply: FastifyReply,
			) => {
				const { documentId } = request.params

				try {
					const history = await RuntimeClient.runPromise(
						Effect.gen(function* (_) {
							const docService = yield* _(LoroDocumentService)
							return yield* _(docService.getHistory(documentId))
						}),
					)

					return reply.send({ documentId, history })
				} catch (error) {
					request.log.error(error)
					return reply
						.status(500)
						.send({ error: 'Failed to get document history' })
				}
			},
		},
	)

	// Create snapshot
	server.post<{
		Params: { documentId: string }
		Body: CreateSnapshotBody
	}>('/documents/:documentId/snapshot', {
		handler: async (
			request: FastifyRequest<{
				Params: { documentId: string }
				Body: CreateSnapshotBody
			}>,
			reply: FastifyReply,
		) => {
			const { documentId } = request.params
			const { message } = request.body
			const session = (request as any).session
			const userId = session.user.id

			try {
				const snapshot = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						const snapshot = yield* docService.createSnapshot(documentId)

						// Optionally add to history with message
						if (message) {
							const doc = yield* docService.getDocument(documentId)
							if (Option.isSome(doc)) {
								yield* docService.applyUpdate(
									documentId,
									new Uint8Array(0), // Empty update just to create history entry
									`${userId} - ${message}`,
								)
							}
						}

						return {
							id: snapshot.id,
							version: snapshot.version,
							createdAt: snapshot.createdAt,
							message,
						}
					}).pipe(
						Effect.catchAll(error => {
							request.log.error('Snapshot error:', error)
							return Effect.fail(new Error('Failed to create snapshot'))
						}),
					),
				)

				return reply.send({ documentId, snapshot })
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to create snapshot' })
			}
		},
	})

	// Checkout specific version
	server.post<{
		Params: { documentId: string }
		Body: CheckoutVersionBody
	}>('/documents/:documentId/checkout', {
		handler: async (
			request: FastifyRequest<{
				Params: { documentId: string }
				Body: CheckoutVersionBody
			}>,
			reply: FastifyReply,
		) => {
			const { documentId } = request.params
			const { version } = request.body

			try {
				await RuntimeClient.runPromise(
					Effect.gen(function* (_) {
						const docService = yield* _(LoroDocumentService)
						yield* _(docService.checkout(documentId, version))
					}).pipe(
						Effect.catchAll(error => {
							request.log.error('Checkout error:', error)
							return Effect.fail(new Error('Failed to checkout version'))
						}),
					),
				)

				return reply.send({ success: true })
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to checkout version' })
			}
		},
	})

	// Update selection
	server.post<{ Body: SelectionUpdateBody }>('/documents/selection', {
		handler: async (
			request: FastifyRequest<{ Body: SelectionUpdateBody }>,
			reply: FastifyReply,
		) => {
			const { documentId, selection } = request.body
			const session = (request as any).session
			const userId = session.user.id

			try {
				await RuntimeClient.runPromise(
					Effect.gen(function* (_) {
						const docService = yield* _(LoroDocumentService)
						yield* _(docService.updateSelection(documentId, userId, selection))
					}),
				)

				return reply.send({ success: true })
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to update selection' })
			}
		},
	})

	// Get active selections
	server.get<{ Params: { documentId: string } }>(
		'/documents/:documentId/selections',
		{
			handler: async (
				request: FastifyRequest<{ Params: { documentId: string } }>,
				reply: FastifyReply,
			) => {
				const { documentId } = request.params

				try {
					const selections = await RuntimeClient.runPromise(
						Effect.gen(function* () {
							const docService = yield* LoroDocumentService
							const selectionsMap =
								yield* docService.getActiveSelections(documentId)

							// Convert Map to object for JSON serialization
							const selectionsObj: Record<string, any> = {}
							selectionsMap.forEach((value, key) => {
								selectionsObj[key] = value
							})

							return selectionsObj
						}),
					)

					return reply.send({ documentId, selections })
				} catch (error) {
					request.log.error(error)
					return reply.status(500).send({ error: 'Failed to get selections' })
				}
			},
		},
	)

	// Get document snapshot for initial load
	server.get<{ Params: { documentId: string } }>('/documents/:documentId', {
		handler: async (
			request: FastifyRequest<{ Params: { documentId: string } }>,
			reply: FastifyReply,
		) => {
			const { documentId } = request.params

			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						const docOption = yield* docService.getDocument(documentId)

						if (Option.isNone(docOption)) {
							return { exists: false }
						}

						const snapshot = yield* docService.createSnapshot(documentId)

						return {
							exists: true,
							documentId,
							snapshot: Buffer.from(snapshot.data).toString('base64'),
							version: snapshot.version,
						}
					}),
				)

				return reply.send(result)
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to get document' })
			}
		},
	})

	server.post<{ Params: { documentId: string } }>('/documents/:documentId', {
		handler: async (
			request: FastifyRequest<{ Params: { documentId: string } }>,
			reply: FastifyReply,
		) => {
			const { documentId } = request.params
			const session = (request as any).session
			const userId = session?.user?.id

			request.log.debug('Create document request:', {
				documentId,
				hasSession: !!session,
				userId: userId || 'undefined',
				sessionKeys: session ? Object.keys(session) : [],
			})

			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						yield* docService.createDocument(documentId)

						return { success: true, documentId }
					}).pipe(
						Effect.catchAll(error => {
							if (error._tag === 'ErrorDocumentAlreadyExists') {
								return Effect.succeed({
									success: false,
									message: 'Document already exists',
								})
							}

							request.log.error('Create document', { error })
							return Effect.fail(new Error('Failed to create document'))
						}),
					),
				)

				request.log.debug(
					'Document create response:',
					JSON.stringify(result, null, 2),
				)
				return reply.send(result)
			} catch (error) {
				request.log.error('Document creation failed:', error)
				return reply.status(500).send({ error: 'Failed to create document' })
			}
		},
	})

	server.get<{ Params: { documentId: string } }>(
		'/documents/:documentId/state',
		{
			handler: async (
				request: FastifyRequest<{ Params: { documentId: string } }>,
				reply: FastifyReply,
			) => {
				const { documentId } = request.params

				try {
					const result = await RuntimeClient.runPromise(
						Effect.gen(function* () {
							const docService = yield* LoroDocumentService
							const docOption = yield* docService.getDocument(documentId)

							if (Option.isNone(docOption)) {
								return { success: false, message: 'Document not found' }
							}

							const doc = docOption.value
							return { success: true, state: doc.toJSON() }
						}).pipe(
							Effect.catchAll(error => {
								request.log.error('Get document state error:', error)
								return Effect.succeed({
									success: false,
									message: 'Failed to get document state',
								})
							}),
						),
					)

					request.log.debug(
						'Document state response:',
						JSON.stringify(result, null, 2),
					)
					return reply.send(result)
				} catch (error) {
					request.log.error(error)
					return reply
						.status(500)
						.send({ error: 'Failed to get document state' })
				}
			},
		},
	)

	server.delete<{ Params: { documentId: string } }>('/documents/:documentId', {
		handler: async (
			request: FastifyRequest<{ Params: { documentId: string } }>,
			reply: FastifyReply,
		) => {
			const { documentId } = request.params

			try {
				await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						yield* docService.deleteDocument(documentId)
					}).pipe(
						Effect.catchAll(error => {
							request.log.error('Delete document error:', error)
							return Effect.fail(new Error('Failed to delete document'))
						}),
					),
				)

				const result = { success: true }
				request.log.debug(
					'Document delete response:',
					JSON.stringify(result, null, 2),
				)
				return reply.send(result)
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to delete document' })
			}
		},
	})

	// List all documents
	server.get('/documents', {
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const result = await RuntimeClient.runPromise(
					Effect.gen(function* () {
						const docService = yield* LoroDocumentService
						const documents = yield* docService.listDocuments()
						return documents
					}).pipe(
						Effect.catchAll(error => {
							request.log.error('List documents error:', error)
							return Effect.fail(new Error('Failed to list documents'))
						}),
					),
				)

				const response = { documents: result }
				request.log.debug(
					'List documents response:',
					JSON.stringify(response, null, 2),
				)
				return reply.send(response)
			} catch (error) {
				request.log.error(error)
				return reply.status(500).send({ error: 'Failed to list documents' })
			}
		},
	})
	// Update the WebSocket route in apps/server/src/routes/documents.ts

	server.get(
		'/documents/:documentId/ws',
		{ websocket: true },
		async (connection, request) => {
			const { documentId } = request.params as { documentId: string }

			try {
				// Since preHandler has already authenticated, session should exist
				const session = (request as any).session
				const userId = session.user.id

				request.log.info(
					`[WS] Authenticated connection established for document: ${documentId}, user: ${userId}`,
					{
						userId,
						documentId,
						sessionId: session.id || 'unknown',
					},
				)

				connection.on('message', async message => {
					const messageStr = message.toString()
					request.log.debug(
						`[WS] Received message from ${userId} on doc ${documentId}`,
						{ messageLength: messageStr.length },
					)

					try {
						const data = JSON.parse(messageStr)
						request.log.debug(`[WS] Parsed message data:`, {
							type: data.type,
							docId: data.docId,
							hasUpdate: !!data.update,
							hasCursor: !!data.cursor,
							hasSelection: !!data.selection,
						})

						if (data.type === 'create_doc') {
							request.log.info(
								`[WS] Creating document: ${documentId} for user: ${userId}`,
							)

							// Case 1: Create new doc or get existing (with retry logic for race conditions)
							const docOption = await RuntimeClient.runPromise(
								Effect.gen(function* () {
									const docService = yield* LoroDocumentService
									return yield* docService.getDocument(documentId)
								}),
							)

							let doc: Option.Option<any>
							if (Option.isSome(docOption)) {
								// Document already exists
								request.log.debug(`[WS] Document already exists: ${documentId}`)
								doc = docOption
							} else {
								// Create new document
								try {
									await RuntimeClient.runPromise(
										Effect.gen(function* () {
											const docService = yield* LoroDocumentService
											yield* docService.createDocument(documentId)
										}).pipe(
											Effect.catchAll(error => {
												if (
													error._tag === 'ErrorDocumentAlreadyExists' ||
													error._tag === 'ErrorDbExecutionFailed'
												) {
													// Document was created by another request, just continue
													request.log.debug(
														`[WS] Document creation race condition handled for: ${documentId}`,
													)
													return Effect.succeed(undefined)
												}
												return Effect.fail(error)
											}),
										),
									)
									request.log.debug(
										`[WS] Document created successfully: ${documentId}`,
									)
								} catch (error) {
									// If creation failed, try to get existing document
									request.log.debug(
										`[WS] Document creation failed, checking if exists: ${documentId}`,
									)
								}

								doc = await RuntimeClient.runPromise(
									Effect.gen(function* () {
										const docService = yield* LoroDocumentService
										return yield* docService.getDocument(documentId)
									}),
								)

								// If still no document, create response indicating failure
								if (Option.isNone(doc)) {
									connection.send(
										JSON.stringify({
											type: 'error',
											message: 'Failed to create or retrieve document',
										}),
									)
									return
								}
							}

							const initialState = Option.isSome(doc) ? doc.value.toJSON() : {}
							const response = {
								type: 'doc_created',
								docId: documentId,
								initialState,
							}

							request.log.debug(`[WS] Sending doc_created response:`, response)
							connection.send(JSON.stringify(response))
						} else if (data.type === 'text_update') {
							request.log.info(
								`[WS] Processing text update for document: ${documentId}, user: ${userId}`,
							)

							// Case 2: Apply incremental text update (no snapshot)
							const updateData = Buffer.from(data.update, 'base64')
							request.log.debug(
								`[WS] Update data size: ${updateData.length} bytes`,
							)

							await RuntimeClient.runPromise(
								Effect.gen(function* () {
									const docService = yield* LoroDocumentService
									yield* docService.applyUpdate(documentId, updateData, userId)
								}),
							)
							request.log.debug(`[WS] Update applied successfully`)

							const doc = await RuntimeClient.runPromise(
								Effect.gen(function* () {
									const docService = yield* LoroDocumentService
									return yield* docService.getDocument(documentId)
								}),
							)
							const newText = Option.isSome(doc)
								? doc.value.getText('text')?.toString() || ''
								: ''

							const response = { type: 'text_updated', newText }
							request.log.debug(`[WS] Sending text_updated response:`, {
								type: response.type,
								textLength: newText.length,
								textPreview:
									newText.substring(0, 100) +
									(newText.length > 100 ? '...' : ''),
							})
							connection.send(JSON.stringify(response))
						} else if (data.type === 'selection_update') {
							request.log.info(
								`[WS] Processing selection update for document: ${documentId}, user: ${userId}`,
							)

							// Case 3: Handle cursor/selection
							const base64Cursor = data.cursor // Base64 encoded cursor from client
							request.log.debug(`[WS] Cursor data:`, {
								base64Cursor: base64Cursor,
								hasSelection: !!data.selection,
								selectionData: data.selection,
							})

							if (!base64Cursor) {
								throw new Error('No cursor data provided')
							}

							const docOption = await RuntimeClient.runPromise(
								Effect.gen(function* () {
									const docService = yield* LoroDocumentService
									return yield* docService.getDocument(documentId)
								}),
							)
							if (Option.isNone(docOption)) {
								request.log.error(`[WS] Document not found: ${documentId}`)
								throw new Error('Document not found')
							}

							const loroDoc = docOption.value // LoroDoc instance
							request.log.debug(`[WS] Got LoroDoc instance, decoding cursor`)

							// Decode the base64 cursor data back to Uint8Array
							const cursorData = Buffer.from(base64Cursor, 'base64')
							request.log.debug(
								`[WS] Decoded cursor data size: ${cursorData.length} bytes`,
							)

							const decodedCursor = Cursor.decode(cursorData)
							request.log.debug(`[WS] Cursor decoded successfully`)

							// Get cursor position - handle invalid cursor gracefully
							let pos: { update?: Cursor; offset: number; side: Side }
							try {
								pos = loroDoc.getCursorPos(decodedCursor)
							} catch (cursorError) {
								request.log.debug(
									`[WS] Invalid cursor for document ${documentId}, cursor may be stale`,
									{
										cursorError:
											cursorError instanceof Error
												? cursorError.message
												: String(cursorError),
									},
								)

								// Send error response for invalid cursor
								connection.send(
									JSON.stringify({
										type: 'error',
										message: 'Cursor position is invalid or stale',
									}),
								)
								return
							}

							const updatedCursor = pos.update
								? Buffer.from(pos.update.encode()).toString('base64')
								: base64Cursor

							const response = {
								type: 'selection_confirmed',
								position: { offset: pos.offset, side: pos.side },
								updatedCursor,
							}

							request.log.debug(`[WS] Cursor position resolved:`, {
								originalCursor: base64Cursor,
								position: response.position,
								hasUpdate: !!pos.update,
								updatedCursor: updatedCursor,
							})
							connection.send(JSON.stringify(response))
						} else {
							request.log.warn(`[WS] Unknown message type: ${data.type}`)
							connection.send(
								JSON.stringify({
									type: 'error',
									message: `Unknown message type: ${data.type}`,
								}),
							)
						}
					} catch (error) {
						request.log.error(
							`[WS] Error processing message: ${JSON.stringify({
								error: error instanceof Error ? error.message : String(error),
								stack: error instanceof Error ? error.stack : undefined,
								documentId,
								userId,
								messageType: (() => {
									try {
										const data = JSON.parse(messageStr)
										return data.type
									} catch {
										return 'unknown'
									}
								})(),
							})}`,
						)

						connection.send(
							JSON.stringify({
								type: 'error',
								message:
									error instanceof Error ? error.message : 'Failed to process',
							}),
						)
					}
				})

				connection.on('close', (code, reason) => {
					request.log.info(
						`[WS] Connection closed for document: ${documentId}, user: ${userId}`,
						{
							code,
							reason: reason?.toString(),
							userId,
							documentId,
						},
					)
				})

				connection.on('error', error => {
					request.log.error(
						`[WS] Connection error for document: ${documentId}, user: ${userId}`,
						{
							message: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
							userId,
							documentId,
						},
					)
				})
			} catch (error) {
				request.log.error(
					`[WS] Failed to establish connection for document: ${documentId}`,
					{
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
				)

				// Close connection with error
				connection.close(1011, 'Server error')
			}
		},
	)
}
