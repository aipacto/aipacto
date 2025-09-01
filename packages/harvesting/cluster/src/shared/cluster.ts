import { ClusterWorkflowEngine, ShardingConfig } from '@effect/cluster'
import {
	NodeClusterRunnerSocket,
	NodeClusterShardManagerSocket,
} from '@effect/platform-node'
// import { PgClient } from '@effect/sql-pg'
import { Layer } from 'effect'

// export const SqlClient = PgClient.layerConfig({
// 	url: Config.redacted(Config.nonEmptyString('CLUSTER_DATABASE_URL')),
// 	onnotice: Config.succeed(constVoid),
// })

export const ClusterConfig = ShardingConfig.layer({
	shardsPerGroup: 300,
	entityMailboxCapacity: 10,
	entityTerminationTimeout: 0,
	entityMessagePollInterval: 5000,
	sendRetryInterval: 100,
})

export const ClusterRunner = NodeClusterRunnerSocket.layer({
	serialization: 'msgpack',
}).pipe(Layer.provideMerge(ClusterConfig))

export const ClusterClient = NodeClusterRunnerSocket.layer({
	serialization: 'msgpack',
	clientOnly: true,
}).pipe(Layer.provideMerge(ClusterConfig))

export const ShardManager = NodeClusterShardManagerSocket.layer({
	serialization: 'msgpack',
}).pipe(Layer.provideMerge(ClusterConfig))

export const ClusterEngineRunner = ClusterWorkflowEngine.layer.pipe(
	Layer.provideMerge(ClusterRunner),
)

export const ClusterEngineClient = ClusterWorkflowEngine.layer.pipe(
	Layer.provideMerge(ClusterClient),
)
