import { Effect, FiberRef, Layer, LogLevel } from 'effect'

import { DocumentProcessing } from '../../document-processor'
import { Extraction } from '../../extraction/workflow'
import type { HarvestingEvent } from '../events'
import { Publisher } from '../publisher'

type Handlers<R> = {
	[K in HarvestingEvent['_tag']]: (
		event: Extract<HarvestingEvent, { _tag: K }>,
	) => Effect.Effect<unknown, never, R>
}

type HandlersContext<T> = {
	[K in keyof T]: T[K] extends (
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		...args: any
		// biome-ignore lint/suspicious/noExplicitAny: TODO
	) => Effect.Effect<any, any, infer R>
		? R
		: never
}[keyof T]

// biome-ignore lint/suspicious/noExplicitAny: To support Effects with `never` as Context type.
const makePublisher = <H extends Partial<Handlers<any>>>(handlers: H) =>
	Effect.gen(function* () {
		const ctx = yield* Effect.context<HandlersContext<H>>()
		const isDebugging = LogLevel.greaterThanEqual(
			yield* FiberRef.currentLogLevel,
			LogLevel.Debug,
		)

		return {
			publish: (event: HarvestingEvent) => {
				const handler = handlers[event._tag] as
					| ((
							e: typeof event,
					  ) => Effect.Effect<unknown, never, HandlersContext<H>>)
					| undefined

				if (handler !== undefined) {
					return Effect.provide(handler(event), ctx)
				}

				return isDebugging ? Effect.logDebug(event) : Effect.void
			},
		}
	})

/**
 * Default Publisher, currently just in-cluster publishing from one workflow to another.
 * This could be a real event architecture that publishes to a message broker, etc.
 *
 * It is kept separate from the Publisher service to avoid circular dependencies.
 */

export const DefaultPublisher = Layer.effect(
	Publisher,
	makePublisher({
		PageDiscovered: event =>
			Extraction.execute({ url: event.url }).pipe(
				// TODO: Better error handling
				Effect.catchAllCause(Effect.logError),
			),
		DocumentDiscovered: event =>
			DocumentProcessing.execute({ url: event.url }).pipe(
				// TODO: Better error handling
				Effect.catchAllCause(Effect.logError),
			),
	}),
)
