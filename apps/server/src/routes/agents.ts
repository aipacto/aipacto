// import {
// 	detectLanguage,
// 	impactAgentGraph,
// 	plannerAgentGraph,
// 	simplifierAgentGraph,
// 	summarizerAgentGraph,
// 	supervisorAgentGraph,
// } from '@aipacto/agents-infra-langchain'
// import { logAppServer } from '@aipacto/shared-utils-logging'
// import { AIMessage, HumanMessage } from '@langchain/core/messages'
// import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// import { authenticateRequest } from '../utils/auth_helper'

// /**
//  * Common interface for agent requests
//  */
// interface AgentRequestBody {
// 	text: string
// 	language?: string
// 	threadId?: string // Optional thread ID for thread-based agents
// 	additionalContext?: Record<string, unknown>
// }

// /**
//  * Registers individual agent routes with authentication
//  */
// export async function routesAgents(fastify: FastifyInstance) {
// 	// Global authentication for all agent routes
// 	fastify.addHook('preHandler', async (request, reply) => {
// 		const isAuthenticated = await authenticateRequest(request, reply)
// 		if (!isAuthenticated) {
// 			return // Reply already sent by authenticateRequest
// 		}
// 	})

// 	/**
// 	 * Shared handler for non-streaming agent requests
// 	 */
// 	async function handleAgentRequest(
// 		request: FastifyRequest<{ Body: AgentRequestBody }>,
// 		reply: FastifyReply,
// 		agentName: string,
// 		agentGraph: any,
// 	) {
// 		try {
// 			const session = (request as any).session
// 			const userId = session.user.id

// 			const { text, language, additionalContext, threadId } = request.body

// 			// Detect language if not provided
// 			const detectedLanguage = language || (await detectLanguage(text))

// 			// Create the messages
// 			const messages = [new HumanMessage(text)]

// 			// Create the initial state for the agent
// 			const initialState = {
// 				messages,
// 				context: {
// 					question: text,
// 					language: detectedLanguage,
// 					additionalContext: {
// 						...additionalContext,
// 						userId,
// 						threadId,
// 					},
// 				},
// 			}

// 			logAppServer.info(`Processing ${agentName} request`, {
// 				textPreview: text.substring(0, 50),
// 				language: detectedLanguage,
// 				userId,
// 				threadId,
// 			})

// 			// Invoke the agent
// 			const result = await agentGraph.invoke(initialState)

// 			if (result.error) {
// 				throw new Error(result.error)
// 			}

// 			// Return the result
// 			return reply.status(200).send(result)
// 		} catch (error) {
// 			logAppServer.error(
// 				`Error in ${agentName} agent:`,
// 				(error as Error).toString(),
// 			)
// 			return reply.status(500).send({
// 				error: `Error processing ${agentName} request`,
// 				message: (error as Error).message,
// 			})
// 		}
// 	}

// 	/**
// 	 * Shared handler for streaming agent requests
// 	 */
// 	async function handleStreamingAgentRequest(
// 		request: FastifyRequest<{ Body: AgentRequestBody }>,
// 		reply: FastifyReply,
// 		agentName: string,
// 		agentGraph: any,
// 	) =>
// 		try {
// 			const session = (request as any).session
// 			const userId = session.user.id

// 			const { text, language, additionalContext, threadId } = request.body

// 			// Detect language if not provided
// 			const detectedLanguage = language || (await detectLanguage(text))

// 			// Create the messages
// 			const messages = [new HumanMessage(text)]

// 			// Create the initial state for the agent
// 			const initialState = {
// 				messages,
// 				context: {
// 					question: text,
// 					language: detectedLanguage,
// 					additionalContext: {
// 						...additionalContext,
// 						userId,
// 						threadId,
// 					},
// 				},
// 			}

// 			logAppServer.info(`Processing streaming ${agentName} request`, {
// 				textPreview: text.substring(0, 50),
// 				language: detectedLanguage,
// 				userId,
// 				threadId,
// 			})

// 			// Set up streaming response
// 			reply.raw.writeHead(200, {
// 				'Content-Type': 'text/plain; charset=utf-8',
// 				'Transfer-Encoding': 'chunked',
// 				'Cache-Control': 'no-cache',
// 				'Connection': 'keep-alive',
// 			})

// 			// Invoke the agent with streaming
// 			const stream = await agentGraph.stream(initialState)

// 			let chunkCount = 0
// 			for await (const chunk of stream) {
// 				if (chunk.error) {
// 					throw new Error(chunk.error)
// 				}

// 				const processedChunk = processStreamChunk(chunk, agentName)
// 				if (processedChunk) {
// 					reply.raw.write(`data: ${JSON.stringify(processedChunk)}\n\n`)
// 					chunkCount++
// 				}
// 			}

// 			// Send end marker
// 			reply.raw.write(`data: [DONE]\n\n`)
// 			reply.raw.end()

// 			logAppServer.info(`Completed streaming ${agentName} request`, {
// 				chunkCount,
// 				userId,
// 				threadId,
// 			})
// 		} catch (error) {
// 			logAppServer.error(
// 				`Error in streaming ${agentName} agent:`,
// 				(error as Error).toString(),
// 			)
// 			if (!reply.sent) {
// 				reply.status(500).send({
// 					error: `Error processing streaming ${agentName} request`,
// 					message: (error as Error).message,
// 				})
// 			}
// 		}

// 	/**
// 	 * Process streaming chunk and extract relevant data
// 	 */
// 	function processStreamChunk(chunk: Record<string, any>, agentName: string) {
// 		try {
// 			// Extract the final answer from the chunk
// 			if (chunk.value && chunk.value.messages) {
// 				const lastMessage = chunk.value.messages[chunk.value.messages.length - 1]
// 				if (lastMessage && lastMessage.content) {
// 					return {
// 						type: 'content',
// 						agent: agentName,
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
// 						agent: agentName,
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
// 					agent: agentName,
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

// 	// Impact Agent - Non-streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/impact', {
// 		handler: async (request, reply) => {
// 			return handleAgentRequest(request, reply, 'Impact', impactAgentGraph)
// 		},
// 	})

// 	// Impact Agent - Streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/impact/stream', {
// 		handler: async (request, reply) => {
// 			return handleStreamingAgentRequest(request, reply, 'Impact', impactAgentGraph)
// 		},
// 	})

// 	// Planner Agent - Non-streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/planner', {
// 		handler: async (request, reply) => {
// 			return handleAgentRequest(request, reply, 'Planner', plannerAgentGraph)
// 		},
// 	})

// 	// Planner Agent - Streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/planner/stream', {
// 		handler: async (request, reply) => {
// 			return handleStreamingAgentRequest(request, reply, 'Planner', plannerAgentGraph)
// 		},
// 	})

// 	// Simplifier Agent - Non-streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/simplifier', {
// 		handler: async (request, reply) => {
// 			return handleAgentRequest(request, reply, 'Simplifier', simplifierAgentGraph)
// 		},
// 	})

// 	// Simplifier Agent - Streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/simplifier/stream', {
// 		handler: async (request, reply) => {
// 			return handleStreamingAgentRequest(request, reply, 'Simplifier', simplifierAgentGraph)
// 		},
// 	})

// 	// Summarizer Agent - Non-streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/summarizer', {
// 		handler: async (request, reply) => {
// 			return handleAgentRequest(request, reply, 'Summarizer', summarizerAgentGraph)
// 		},
// 	})

// 	// Summarizer Agent - Streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/summarizer/stream', {
// 		handler: async (request, reply) => {
// 			return handleStreamingAgentRequest(request, reply, 'Summarizer', summarizerAgentGraph)
// 		},
// 	})

// 	// Supervisor Agent - Non-streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/supervisor', {
// 		handler: async (request, reply) => {
// 			return handleAgentRequest(request, reply, 'Supervisor', supervisorAgentGraph)
// 		},
// 	})

// 	// Supervisor Agent - Streaming
// 	fastify.post<{ Body: AgentRequestBody }>('/agents/supervisor/stream', {
// 		handler: async (request, reply) => {
// 			return handleStreamingAgentRequest(request, reply, 'Supervisor', supervisorAgentGraph)
// 		},
// 	})
// }
