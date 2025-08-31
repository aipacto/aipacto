import { Activity, Workflow } from '@effect/workflow'
import { Effect, Schema } from 'effect'

export class ExtractionError extends Schema.TaggedError<ExtractionError>()(
	'ExtractionError',
	{},
) {}

export class ExtractionJob extends Schema.Class<ExtractionJob>('ExtractionJob')(
	{
		url: Schema.URL,
	},
) {}

/**
 * Get the initial content of a URL
 */
export const visit = Activity.make({
	name: 'Extraction:visit',
	error: ExtractionError,
	execute: Effect.gen(function* () {
		yield* Effect.log('Extraction')
	}),
})

/**
 * Extract from the HTML content of the page
 */
export const downloadHtml = () =>
	Activity.make({
		name: 'Extraction:downloadHtml',
		error: ExtractionError,
		execute: Effect.gen(function* () {
			yield* Effect.log('Extraction')
		}),
	})

/**
 * Extract the information from the downloaded HTML
 */
export const extractHtml = () =>
	Activity.make({
		name: 'Extraction:extractHtml',
		error: ExtractionError,
		execute: Effect.gen(function* () {
			yield* Effect.log('Extraction')
		}),
	})

/**
 * The extraction workflow
 */
export const Extraction = Workflow.make({
	name: 'Extraction',
	payload: ExtractionJob,
	error: ExtractionError,
	idempotencyKey: job => job.url.href,
})

export const ExtractionLayer = Extraction.toLayer(
	Effect.fn('extraction')(function* (_payload) {}),
)
