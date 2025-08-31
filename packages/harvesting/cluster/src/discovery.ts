import { Activity, Workflow } from '@effect/workflow'
import { Effect, Schema } from 'effect'

export class DiscoveryError extends Schema.TaggedError<DiscoveryError>()(
	'DiscoveryError',
	{},
) {}

export class DiscoveryJob extends Schema.Class<DiscoveryJob>('DiscoveryJob')({
	url: Schema.URL,
}) {}

export const discover = Activity.make({
	name: 'Discovery:discover',
	error: DiscoveryError,
	execute: Effect.gen(function* () {
		yield* Effect.log('Discovery')
	}),
})

export const Discovery = Workflow.make({
	name: 'Discovery',
	payload: DiscoveryJob,
	idempotencyKey: job => job.url.href,
})

export const DiscoveryLayer = Discovery.toLayer(
	Effect.fn('discovery')(function* (_payload) {}),
)
