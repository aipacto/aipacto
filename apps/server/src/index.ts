import 'dotenv/config'
import { Env } from '@aipacto/shared-utils-env'
import { logAppServer } from '@aipacto/shared-utils-logging'
import cors from '@fastify/cors'
import formbodyPlugin from '@fastify/formbody'
import webSocketPlugin from '@fastify/websocket'
import { Effect } from 'effect'
import Fastify from 'fastify'

// import { routesAgents } from './routes/agents'
// import { routesThreads } from './routes/threads'
import { routesAuth } from './routes/auth'
import { routesDocuments } from './routes/documents'

async function main() {
	try {
		await Effect.runPromise(Env.load.pipe(Effect.provide(Env.Live)))
	} catch (error) {
		logAppServer.error(
			'Failed to bootstrap application',
			(error as Error).toString(),
		)
		process.exit(1)
	}

	const serverOptions = {
		logger:
			process.env.NODE_ENV === 'development'
				? {
						level: 'debug',
						transport: {
							target: 'pino-pretty',
							options: {
								colorize: true,
								translateTime: 'SYS:standard',
							},
						},
					}
				: {
						level: 'warn',
					},
		trustProxy: true,
	}

	const server = Fastify(serverOptions)

	logAppServer.info('Registering WebSocket plugin...')
	await server.register(webSocketPlugin, {
		options: {
			maxPayload: 1048576, // 1MB max message size
		},
	})

	// Register formbody plugin to parse form data
	logAppServer.info('Registering Formbody plugin')
	server.register(formbodyPlugin)

	// Register CORS
	logAppServer.info('Registering CORS plugin')
	server.register(cors, {
		origin: (origin, callback) => {
			// Allow all origins in development
			if (process.env.NODE_ENV === 'development') {
				callback(null, true)
				return
			}

			// In production, check against allowed origins
			const allowedOrigins =
				process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || []
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('CORS origin not allowed'), false)
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		maxAge: 86400, // 24 hours
		preflight: true,
		strictPreflight: true,
	})

	server.setErrorHandler((err, _request, reply) => {
		logAppServer.error('Server error:', err)

		if (!reply.sent) {
			reply.status(500).send({ error: 'Internal Server Error' })
		}
	})

	// Health check route (no authentication required)
	logAppServer.info('Registering health check route')
	server.get('/api/health', async () => {
		return { message: 'OK' }
	})

	// Authentication routes (no authentication required)
	logAppServer.info('Registering authentication routes')
	await routesAuth(server)

	logAppServer.info('Registering API routes under /api prefix...')

	// Register all API routes under /api prefix
	await server.register(
		async apiServer => {
			// await routesAgents(apiServer)
			await routesDocuments(apiServer)
			// await routesThreads(apiServer)
		},
		{ prefix: '/api' },
	)

	try {
		const port = 3000
		await server.listen({
			host: process.env.SERVER_HOST || '0.0.0.0',
			port,
		})

		server.log.info(`Server listening at http://localhost:${port}`)
		server.log.info(`API available at http://localhost:${port}/api`)
	} catch (error) {
		if (error instanceof Error) {
			logAppServer.error(error.toString())
		} else {
			logAppServer.error('An unknown error occurred')
		}
	}
}

await main()
