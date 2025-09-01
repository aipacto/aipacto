import { NodeRuntime } from '@effect/platform-node'
import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { DiscoveryWorkflow } from './discovery'
import { Server } from './http'
import { Browsers } from './shared/browsers'
import { ClusterEngineRunner, ShardManager } from './shared/cluster'
import { DefaultPublisher } from './shared/infrastructure/publisher'

// Currently setup to run everything in a single process

const main = Layer.mergeAll(Server, DiscoveryWorkflow, ShardManager).pipe(
	Layer.provide([DefaultPublisher, Browsers.Default]),
	Layer.provide([ClusterEngineRunner]),
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
	Layer.launch,
)

NodeRuntime.runMain(main)
