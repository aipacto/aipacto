import { Activity, Workflow } from '@effect/workflow'
import { Effect, Schema } from 'effect'

/**
 * Error type for document processing
 */
export class DocumentProcessingError extends Schema.TaggedError<DocumentProcessingError>()(
	'DocumentProcessingError',
	{},
) {}

/**
 * Payload for document processing workflow
 */
export class DocumentProcessingJob extends Schema.Class<DocumentProcessingJob>(
	'DocumentProcessingJob',
)({
	url: Schema.URL,
}) {}

/**
 * Download the document from the given URL
 */
export const downloadDocument = Activity.make({
	name: 'DocumentProcessing:downloadDocument',
	error: DocumentProcessingError,
	execute: Effect.gen(function* () {
		yield* Effect.log('Downloading document')
	}),
})

/**
 * Store the downloaded document
 */
export const storeDocument = Activity.make({
	name: 'DocumentProcessing:storeDocument',
	error: DocumentProcessingError,
	execute: Effect.gen(function* () {
		yield* Effect.log('Storing document')
	}),
})

/**
 * Create embeddings for the document
 */
export const createEmbeddings = Activity.make({
	name: 'DocumentProcessing:createEmbeddings',
	error: DocumentProcessingError,
	execute: Effect.gen(function* () {
		yield* Effect.log('Creating embeddings')
	}),
})

/**
 * The document processing workflow
 */
export const DocumentProcessing = Workflow.make({
	name: 'DocumentProcessing',
	payload: DocumentProcessingJob,
	error: DocumentProcessingError,
	idempotencyKey: job => job.url.href,
})

export const DocumentProcessingLayer = DocumentProcessing.toLayer(
	Effect.fn('documentProcessing')(function* (_payload) {}),
)
