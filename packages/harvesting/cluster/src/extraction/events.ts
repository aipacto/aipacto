import { Schema } from 'effect'

export class ExtractionStarted extends Schema.TaggedClass<ExtractionStarted>()(
	'ExtractionStarted',
	{
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionCompleted extends Schema.TaggedClass<ExtractionCompleted>()(
	'ExtractionCompleted',
	{
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionFailed extends Schema.TaggedClass<ExtractionFailed>()(
	'ExtractionFailed',
	{
		executionId: Schema.String,
		timestamp: Schema.Date,
		error: Schema.String,
	},
) {}

export class HtmlMetadataExtracted extends Schema.TaggedClass<HtmlMetadataExtracted>()(
	'HtmlMetadataExtracted',
	{
		executionId: Schema.String,
		timestamp: Schema.Date,
		url: Schema.URL,
		metadata: Schema.Unknown, // TODO: Define proper metadata schema
	},
) {}

export class DocumentDownloaded extends Schema.TaggedClass<DocumentDownloaded>()(
	'DocumentDownloaded',
	{
		documentId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export const ExtractionEvent = Schema.Union(
	ExtractionStarted,
	ExtractionCompleted,
	ExtractionFailed,
	HtmlMetadataExtracted,
	DocumentDownloaded,
)
export type ExtractionEvent = typeof ExtractionEvent.Type
