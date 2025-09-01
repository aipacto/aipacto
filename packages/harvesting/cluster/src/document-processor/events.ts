import { Schema } from 'effect'

export class DocumentProcessingStarted extends Schema.TaggedClass<DocumentProcessingStarted>()(
	'DocumentProcessingStarted',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingCompleted extends Schema.TaggedClass<DocumentProcessingCompleted>()(
	'DocumentProcessingCompleted',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingFailed extends Schema.TaggedClass<DocumentProcessingFailed>()(
	'DocumentProcessingFailed',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class DocumentDownloaded extends Schema.TaggedClass<DocumentDownloaded>()(
	'DocumentDownloaded',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class DocumentStored extends Schema.TaggedClass<DocumentStored>()(
	'DocumentStored',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
		storageId: Schema.String,
	},
) {}

export class EmbeddingsCreated extends Schema.TaggedClass<EmbeddingsCreated>()(
	'EmbeddingsCreated',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export const DocumentProcessingEvent = Schema.Union(
	DocumentProcessingStarted,
	DocumentProcessingCompleted,
	DocumentProcessingFailed,
	DocumentDownloaded,
	DocumentStored,
	EmbeddingsCreated,
)
export type DocumentProcessingEvent = typeof DocumentProcessingEvent.Type
