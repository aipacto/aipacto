/** biome-ignore-all lint/suspicious/noExplicitAny: Sometimes we need to use `any` */

import { Cause, Context, Effect, PrimaryKey, Record } from 'effect'

import type { HarvestingEvent } from './events'

const getTimestamp = Effect.clockWith(clock => clock.currentTimeMillis).pipe(
	Effect.map(timestamp => new Date(timestamp)),
)

export class Publisher extends Context.Tag('Publisher')<
	Publisher,
	{
		readonly publish: (event: HarvestingEvent) => Effect.Effect<void>
	}
>() {
	static readonly publish = Effect.fn('Publisher.publish')(function* <
		Args extends Readonly<Record<string, unknown>>,
		Event extends HarvestingEvent,
	>(make: new (args: Args) => Event, args: Omit<NoInfer<Args>, 'timestamp'>) {
		const { publish } = yield* Publisher
		const timestamp = yield* getTimestamp
		// Type-safe: ensures args matches the event's make argument minus 'timestamp'
		return yield* publish(new make({ ...args, timestamp } as unknown as Args))
	})

	static readonly trace = <
		JobKey extends string,
		Start extends new (
			args: {
				executionId: string
				timestamp: Date
			} & {
				readonly [_ in JobKey]: string
			},
		) => HarvestingEvent,
		End extends new (
			args: {
				executionId: string
				timestamp: Date
			} & {
				readonly [_ in JobKey]: string
			},
		) => HarvestingEvent,
		Fail extends new (
			args: {
				executionId: string
				timestamp: Date
				error: string
			} & {
				readonly [_ in JobKey]: string
			},
		) => HarvestingEvent,
	>(params: {
		jobKey: JobKey
		Start: Start
		End: End
		Fail: Fail
	}) =>
		Effect.fn('Publisher.trace')(function* <
			A,
			E,
			R,
			Job extends PrimaryKey.PrimaryKey,
		>(effect: Effect.Effect<A, E, R>, job: Job, executionId: string) {
			const publisher = yield* Publisher

			yield* publisher.publish(
				new params.Start({
					...Record.singleton(params.jobKey, PrimaryKey.value(job)),
					executionId,
					timestamp: yield* getTimestamp,
				}),
			)

			return yield* effect.pipe(
				Effect.tapErrorCause(cause =>
					Effect.gen(function* () {
						yield* publisher.publish(
							new params.Fail({
								...Record.singleton(params.jobKey, PrimaryKey.value(job)),
								executionId,
								timestamp: yield* getTimestamp,
								error: Cause.pretty(cause),
							}),
						)
					}),
				),
				Effect.tap(_ =>
					Effect.gen(function* () {
						yield* publisher.publish(
							new params.End({
								...Record.singleton(params.jobKey, PrimaryKey.value(job)),
								executionId,
								timestamp: yield* getTimestamp,
							}),
						)
					}),
				),
			)
		})
}
