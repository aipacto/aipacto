import { Schema } from 'effect'

export class ExtractionStarted extends Schema.TaggedClass<ExtractionStarted>()(
	'ExtractionStarted',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionCompleted extends Schema.TaggedClass<ExtractionCompleted>()(
	'ExtractionCompleted',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionFailed extends Schema.TaggedClass<ExtractionFailed>()(
	'ExtractionFailed',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
		error: Schema.String,
	},
) {}

export class HtmlMetadataExtracted extends Schema.TaggedClass<HtmlMetadataExtracted>()(
	'HtmlMetadataExtracted',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
		metadata: Schema.Unknown, // TODO: Define proper metadata schema
	},
) {}

export class DocumentDiscovered extends Schema.TaggedClass<DocumentDiscovered>()(
	'DocumentDiscovered',
	{
		url: Schema.URL,
		timestamp: Schema.Date,
	},
) {}

export const ExtractionEvent = Schema.Union(
	ExtractionStarted,
	ExtractionCompleted,
	ExtractionFailed,
	HtmlMetadataExtracted,
	DocumentDiscovered,
)
export type ExtractionEvent = typeof ExtractionEvent.Type
