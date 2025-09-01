import { ClusterCron } from '@effect/cluster'
import { Config, Cron, Effect, Layer, Stream } from 'effect'

import { DiscoveryJobs } from '@/discovery/services'
import { Discovery } from '@/discovery/workflow'

export const DiscoveryCronConfig = Config.all({
	cronString: Config.nonEmptyString('CRON'),
	concurrency: Config.integer('CONCURRENCY'),
}).pipe(
	Config.nested('DISCOVERY'),
	Effect.bind('cron', ({ cronString }) => Cron.parse(cronString)),
)

/**
 * Every time the configured cron time is hit, the discovery jobs will be loaded lazily and executed
 * at the configured concurrency.
 */
export const DiscoveryCron = Layer.unwrapScoped(
	Effect.gen(function* () {
		const { cron, concurrency } = yield* DiscoveryCronConfig

		return ClusterCron.make({
			name: 'DiscoveryCron',
			cron,
			execute: DiscoveryJobs.load.pipe(
				Stream.mapEffect(Discovery.execute, { concurrency }),
				Stream.runDrain,
			),
		})
	}),
).pipe(Layer.provide(DiscoveryJobs.Default))
