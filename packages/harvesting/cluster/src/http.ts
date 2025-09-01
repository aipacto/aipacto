import { createServer } from 'node:http'
import {
	HttpApi,
	HttpApiBuilder,
	HttpApiScalar,
	HttpMiddleware,
} from '@effect/platform'
import { withLogAddress } from '@effect/platform/HttpServer'
import { NodeHttpServer } from '@effect/platform-node'
import { WorkflowProxy, WorkflowProxyServer } from '@effect/workflow'
import { Config, Effect, Layer } from 'effect'

import { Discovery } from './discovery/workflow'
import { DocumentProcessing } from './document-processor/workflow'
import { Extraction } from './extraction/workflow'

const workflows = [Discovery, DocumentProcessing, Extraction] as const

// TODO: If we want an HTTP API over our workflows, we can use this
export const HarvestingHttpGroup = WorkflowProxy.toHttpApiGroup(
	'Harvesting',
	workflows,
)
export const HarvestingHttpApi =
	HttpApi.make('Harvesting').add(HarvestingHttpGroup)

export const ServerConfig = Config.all({
	port: Config.integer('PORT').pipe(Config.withDefault(3000)),
})

export const Server = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	withLogAddress,
	Layer.provide(HttpApiScalar.layer({ path: '/docs' })),
	Layer.provide(HttpApiBuilder.api(HarvestingHttpApi)),
	Layer.provide(
		WorkflowProxyServer.layerHttpApi(
			HarvestingHttpApi,
			'Harvesting',
			workflows,
		),
	),
	Layer.provide(
		Layer.unwrapScoped(
			Effect.gen(function* () {
				const { port } = yield* ServerConfig
				return NodeHttpServer.layer(createServer, { port })
			}),
		),
	),
)
