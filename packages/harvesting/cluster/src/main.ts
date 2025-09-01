// Currently setup to run everything in a single process

process.env.DISCOVERY_CRON = '0 2 * * *'
process.env.DISCOVERY_CONCURRENCY = '4'

import { ClusterWorkflowEngine } from '@effect/cluster'
import {
	NodeClusterRunnerSocket,
	NodeClusterShardManagerSocket,
	NodeRuntime,
} from '@effect/platform-node'
import { Config, ConfigProvider, Effect, Layer, Logger, LogLevel } from 'effect'

import { DiscoveryCron, DiscoveryWorkflow } from './discovery/index.js'
import { Server } from './http.js'
import { Browsers } from './shared/browsers.js'
import { DefaultPublisher } from './shared/infrastructure/publisher.js'

const main = Layer.mergeAll(Server, DiscoveryCron).pipe(
	Layer.provide([DiscoveryWorkflow]),
	Layer.provide([DefaultPublisher, Browsers.Default]),
	Layer.provide([ClusterWorkflowEngine.layer]),
	Layer.provide([NodeClusterRunnerSocket.layer()]),
	Layer.provide([NodeClusterShardManagerSocket.layer()]),
	Layer.provide(
		Layer.unwrapEffect(
			Effect.gen(function* () {
				const logLevel = yield* Config.logLevel('LOG_LEVEL').pipe(
					Config.withDefault(LogLevel.Debug),
				)
				return Logger.minimumLogLevel(logLevel)
			}),
		),
	),
	Layer.provide(
		Layer.succeed(ConfigProvider.ConfigProvider, ConfigProvider.fromEnv()),
	),
	Layer.launch,
)

NodeRuntime.runMain(main)
