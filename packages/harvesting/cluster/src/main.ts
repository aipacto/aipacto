import { NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'

import { DiscoveryWorkflow } from './discovery'
import { Server } from './http'
import { Browsers } from './shared/browsers'
import { ClusterEngineRunner, ShardManager } from './shared/cluster'
import { DefaultPublisher } from './shared/infrastructure/publisher'

// Currently setup to run everything in a single process

const main = Layer.mergeAll(Server, DiscoveryWorkflow, ShardManager).pipe(
	Layer.provide([DefaultPublisher, Browsers.Default]),
	Layer.provide([ClusterEngineRunner]),
	Layer.launch,
)

NodeRuntime.runMain(main)
