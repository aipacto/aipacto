import { Schema } from 'effect'

export class DocumentProcessingStarted extends Schema.TaggedClass<DocumentProcessingStarted>()(
	'DocumentProcessingStarted',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingCompleted extends Schema.TaggedClass<DocumentProcessingCompleted>()(
	'DocumentProcessingCompleted',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingFailed extends Schema.TaggedClass<DocumentProcessingFailed>()(
	'DocumentProcessingFailed',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
		error: Schema.String,
	},
) {}

export class EmbeddingsCreated extends Schema.TaggedClass<EmbeddingsCreated>()(
	'EmbeddingsCreated',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentMetadataExtracted extends Schema.TaggedClass<DocumentMetadataExtracted>()(
	'DocumentMetadataExtracted',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
		metadata: Schema.Unknown, // TODO: Define proper metadata schema
	},
) {}

export const DocumentProcessingEvent = Schema.Union(
	DocumentProcessingStarted,
	DocumentProcessingCompleted,
	DocumentProcessingFailed,
	EmbeddingsCreated,
	DocumentMetadataExtracted,
)
export type DocumentProcessingEvent = typeof DocumentProcessingEvent.Type
