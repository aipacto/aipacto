// import {
// 	type ConversationMessage,
// 	supervisorAgentGraph,
// } from '@aipacto/agents-infra-langchain'
// import { logAppServer } from '@aipacto/shared-utils-logging'
// import { AIMessage, HumanMessage } from '@langchain/core/messages'
// import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// import { authenticateRequest } from '../utils/auth_helper'

// // In-memory store for threads
// // TODO: Replace with persistent database in production
// const threadStore = new Map<string, Array<ConversationMessage>>()

// /**
//  * Interface for thread-related requests
//  */
// interface ThreadRequestBody {
// 	threadId?: string
// 	text?: string
// 	language?: string
// 	additionalContext?: Record<string, unknown>
// }

// interface ThreadMessageRequestBody {
// 	text: string
// 	language?: string
// 	additionalContext?: Record<string, unknown>
// }

// /**
//  * Registers thread-related routes with authentication
//  */
// export async function routesThreads(fastify: FastifyInstance) {
// 	// Global authentication for all thread routes
// 	fastify.addHook('preHandler', async (request, reply) => {
// 		const isAuthenticated = await authenticateRequest(request, reply)
// 		if (!isAuthenticated) {
// 			return // Reply already sent by authenticateRequest
// 		}
// 	})

// 	// Create a new thread or get an existing one
// 	fastify.post(
// 		'/threads',
// 		async (
// 			request: FastifyRequest<{ Body: ThreadRequestBody }>,
// 			reply: FastifyReply,
// 		) => {
// 			try {
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				const { threadId } = request.body || {}

// 				// Generate a thread ID if not provided
// 				const actualThreadId = threadId || `thread-${userId}-${Date.now()}`

// 				// Initialize thread if it doesn't exist
// 				if (!threadStore.has(actualThreadId)) {
// 					threadStore.set(actualThreadId, [])
// 				}

// 				logAppServer.info('Thread accessed', {
// 					threadId: actualThreadId,
// 					userId,
// 				})

// 				// Return the thread
// 				return reply.status(200).send({
// 					threadId: actualThreadId,
// 					messages: threadStore.get(actualThreadId),
// 				})
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error accessing thread:',
// 					(error as Error).toString(),
// 				)
// 				return reply.status(500).send({
// 					error: 'Error accessing thread',
// 					message: (error as Error).message,
// 				})
// 			}
// 		},
// 	)

// 	// Get a specific thread by ID
// 	fastify.get(
// 		'/threads/:threadId',
// 		async (
// 			request: FastifyRequest<{ Params: { threadId: string } }>,
// 			reply: FastifyReply,
// 		) => {
// 			try {
// 				const { threadId } = request.params
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				// Check if thread exists
// 				if (!threadStore.has(threadId)) {
// 					return reply.status(404).send({
// 						error: 'Thread not found',
// 						threadId,
// 					})
// 				}

// 				logAppServer.info('Thread retrieved', {
// 					threadId,
// 					userId,
// 				})

// 				// Return the thread
// 				return reply.status(200).send({
// 					threadId,
// 					messages: threadStore.get(threadId),
// 				})
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error retrieving thread:',
// 					(error as Error).toString(),
// 				)
// 				return reply.status(500).send({
// 					error: 'Error retrieving thread',
// 					message: (error as Error).message,
// 				})
// 			}
// 		},
// 	)

// 	// Add a message to a thread
// 	fastify.post(
// 		'/threads/:threadId/messages',
// 		async (
// 			request: FastifyRequest<{
// 				Params: { threadId: string }
// 				Body: ThreadMessageRequestBody
// 			}>,
// 			reply: FastifyReply,
// 		) => {
// 			try {
// 				const { threadId } = request.params
// 				const { text, language, additionalContext } = request.body
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				// Check if thread exists
// 				if (!threadStore.has(threadId)) {
// 					return reply.status(404).send({
// 						error: 'Thread not found',
// 						threadId,
// 					})
// 				}

// 				// Add user message to thread
// 				const userMessage: ConversationMessage = {
// 					id: `msg-${Date.now()}-${Math.random()}`,
// 					role: 'user',
// 					content: text,
// 					timestamp: new Date().toISOString(),
// 					metadata: {
// 						userId,
// 						language,
// 						additionalContext,
// 					},
// 				}

// 				const thread = threadStore.get(threadId)!
// 				thread.push(userMessage)

// 				logAppServer.info('User message added to thread', {
// 					threadId,
// 					userId,
// 					messageId: userMessage.id,
// 				})

// 				// Process with supervisor agent
// 				const initialState = {
// 					messages: [
// 						...thread.map(msg => {
// 							if (msg.role === 'user') {
// 								return new HumanMessage(msg.content)
// 							} else {
// 								return new AIMessage(msg.content)
// 							}
// 						}),
// 					],
// 					context: {
// 						question: text,
// 						language: language || 'en',
// 						additionalContext: {
// 							...additionalContext,
// 							userId,
// 							threadId,
// 						},
// 					},
// 				}

// 				// Get agent response
// 				const result = await supervisorAgentGraph.invoke(initialState)

// 				if (result.error) {
// 					throw new Error(result.error)
// 				}

// 				// Add AI response to thread
// 				const aiMessage: ConversationMessage = {
// 					id: `msg-${Date.now()}-${Math.random()}`,
// 					role: 'assistant',
// 					content: result.output || result.text || 'No response generated',
// 					timestamp: new Date().toISOString(),
// 					metadata: {
// 						agent: 'supervisor',
// 						threadId,
// 					},
// 				}

// 				thread.push(aiMessage)

// 				logAppServer.info('AI response added to thread', {
// 					threadId,
// 					messageId: aiMessage.id,
// 				})

// 				// Return the updated thread
// 				return reply.status(200).send({
// 					threadId,
// 					messages: thread,
// 					userMessage,
// 					aiMessage,
// 				})
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error adding message to thread:',
// 					(error as Error).toString(),
// 				)
// 				return reply.status(500).send({
// 					error: 'Error adding message to thread',
// 					message: (error as Error).message,
// 				})
// 			}
// 		},
// 	)

// 	// Stream a message to a thread
// 	fastify.post(
// 		'/threads/:threadId/messages/stream',
// 		async (
// 			request: FastifyRequest<{
// 				Params: { threadId: string }
// 				Body: ThreadMessageRequestBody
// 			}>,
// 			reply: FastifyReply,
// 		) => {
// 			try {
// 				const { threadId } = request.params
// 				const { text, language, additionalContext } = request.body
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				// Check if thread exists
// 				if (!threadStore.has(threadId)) {
// 					return reply.status(404).send({
// 						error: 'Thread not found',
// 						threadId,
// 					})
// 				}

// 				// Add user message to thread
// 				const userMessage: ConversationMessage = {
// 					id: `msg-${Date.now()}-${Math.random()}`,
// 					role: 'user',
// 					content: text,
// 					timestamp: new Date().toISOString(),
// 					metadata: {
// 						userId,
// 						language,
// 						additionalContext,
// 					},
// 				}

// 				const thread = threadStore.get(threadId)!
// 				thread.push(userMessage)

// 				logAppServer.info('User message added to thread (streaming)', {
// 					threadId,
// 					userId,
// 					messageId: userMessage.id,
// 				})

// 				// Set up streaming response
// 				reply.raw.writeHead(200, {
// 					'Content-Type': 'text/plain; charset=utf-8',
// 					'Transfer-Encoding': 'chunked',
// 					'Cache-Control': 'no-cache',
// 					Connection: 'keep-alive',
// 				})

// 				// Process with supervisor agent
// 				const initialState = {
// 					messages: [
// 						...thread.map(msg => {
// 							if (msg.role === 'user') {
// 								return new HumanMessage(msg.content)
// 							} else {
// 								return new AIMessage(msg.content)
// 							}
// 						}),
// 					],
// 					context: {
// 						question: text,
// 						language: language || 'en',
// 						additionalContext: {
// 							...additionalContext,
// 							userId,
// 							threadId,
// 						},
// 					},
// 				}

// 				// Stream the agent response
// 				const stream = await supervisorAgentGraph.stream(initialState)

// 				let chunkCount = 0
// 				let finalResponse = ''

// 				for await (const chunk of stream) {
// 					if (chunk.error) {
// 						throw new Error(chunk.error)
// 					}

// 					const processedChunk = processStreamChunk(chunk)
// 					if (processedChunk) {
// 						reply.raw.write(`data: ${JSON.stringify(processedChunk)}\n\n`)
// 						chunkCount++

// 						// Accumulate final response
// 						if (processedChunk.content) {
// 							finalResponse += processedChunk.content
// 						}
// 					}
// 				}

// 				// Add AI response to thread
// 				const aiMessage: ConversationMessage = {
// 					id: `msg-${Date.now()}-${Math.random()}`,
// 					role: 'assistant',
// 					content: finalResponse || 'No response generated',
// 					timestamp: new Date().toISOString(),
// 					metadata: {
// 						agent: 'supervisor',
// 						threadId,
// 					},
// 				}

// 				thread.push(aiMessage)

// 				logAppServer.info('AI response added to thread (streaming)', {
// 					threadId,
// 					messageId: aiMessage.id,
// 					chunkCount,
// 				})

// 				// Send end marker
// 				reply.raw.write(`data: [DONE]\n\n`)
// 				reply.raw.end()
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error streaming message to thread:',
// 					(error as Error).toString(),
// 				)
// 				if (!reply.sent) {
// 					reply.status(500).send({
// 						error: 'Error streaming message to thread',
// 						message: (error as Error).message,
// 					})
// 				}
// 			}
// 		},
// 	)

// 	// Delete a thread
// 	fastify.delete(
// 		'/threads/:threadId',
// 		async (
// 			request: FastifyRequest<{ Params: { threadId: string } }>,
// 			reply: FastifyReply,
// 		) => {
// 			try {
// 				const { threadId } = request.params
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				// Check if thread exists
// 				if (!threadStore.has(threadId)) {
// 					return reply.status(404).send({
// 						error: 'Thread not found',
// 						threadId,
// 					})
// 				}

// 				// Delete the thread
// 				threadStore.delete(threadId)

// 				logAppServer.info('Thread deleted', {
// 					threadId,
// 					userId,
// 				})

// 				return reply.status(200).send({
// 					success: true,
// 					threadId,
// 				})
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error deleting thread:',
// 					(error as Error).toString(),
// 				)
// 				return reply.status(500).send({
// 					error: 'Error deleting thread',
// 					message: (error as Error).message,
// 				})
// 			}
// 		},
// 	)

// 	// List all threads for a user
// 	fastify.get(
// 		'/threads',
// 		async (request: FastifyRequest, reply: FastifyReply) => {
// 			try {
// 				const session = (request as any).session
// 				const userId = session.user.id

// 				// Filter threads by user ID (simple implementation)
// 				// In production, this would query a database
// 				const userThreads = Array.from(threadStore.entries())
// 					.filter(([threadId]) => threadId.includes(userId))
// 					.map(([threadId, messages]) => ({
// 						threadId,
// 						messageCount: messages.length,
// 						lastMessage: messages[messages.length - 1] || null,
// 					}))

// 				logAppServer.info('User threads retrieved', {
// 					userId,
// 					threadCount: userThreads.length,
// 				})

// 				return reply.status(200).send({
// 					threads: userThreads,
// 				})
// 			} catch (error) {
// 				logAppServer.error(
// 					'Error retrieving user threads:',
// 					(error as Error).toString(),
// 				)
// 				return reply.status(500).send({
// 					error: 'Error retrieving user threads',
// 					message: (error as Error).message,
// 				})
// 			}
// 		},
// 	)

// 	/**
// 	 * Process streaming chunk and extract relevant data
// 	 */
// 	function processStreamChunk(chunk: Record<string, any>) {
// 		try {
// 			// Extract the final answer from the chunk
// 			if (chunk.value && chunk.value.messages) {
// 				const lastMessage =
// 					chunk.value.messages[chunk.value.messages.length - 1]
// 				if (lastMessage && lastMessage.content) {
// 					return {
// 						type: 'content',
// 						content: lastMessage.content,
// 						timestamp: new Date().toISOString(),
// 					}
// 				}
// 			}

// 			// Handle intermediate steps or tool calls
// 			if (chunk.value && chunk.value.steps) {
// 				const lastStep = chunk.value.steps[chunk.value.steps.length - 1]
// 				if (lastStep && lastStep.action) {
// 					return {
// 						type: 'step',
// 						action: lastStep.action,
// 						step: lastStep,
// 						timestamp: new Date().toISOString(),
// 					}
// 				}
// 			}

// 			// Handle any other relevant data
// 			if (chunk.value && chunk.value.context) {
// 				return {
// 					type: 'context',
// 					context: chunk.value.context,
// 					timestamp: new Date().toISOString(),
// 				}
// 			}

// 			return null
// 		} catch (error) {
// 			logAppServer.error('Error processing stream chunk:', error)
// 			return null
// 		}
// 	}
// }
