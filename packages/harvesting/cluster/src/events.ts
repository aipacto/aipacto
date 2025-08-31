import { Schema } from 'effect'

export class DiscoveryStarted extends Schema.TaggedClass<DiscoveryStarted>()(
	'DiscoveryStarted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DiscoveryCompleted extends Schema.TaggedClass<DiscoveryCompleted>()(
	'DiscoveryCompleted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
		pagesDiscovered: Schema.Number,
	},
) {}

export class DiscoveryFailed extends Schema.TaggedClass<DiscoveryFailed>()(
	'DiscoveryFailed',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
		error: Schema.String,
	},
) {}

export class PageDiscovered extends Schema.TaggedClass<PageDiscovered>()(
	'PageDiscovered',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
		sourceUrl: Schema.URL, // URL that led to this discovery
		depth: Schema.Number, // How many hops from the original URL
	},
) {}

export class ExtractionStarted extends Schema.TaggedClass<ExtractionStarted>()(
	'ExtractionStarted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionCompleted extends Schema.TaggedClass<ExtractionCompleted>()(
	'ExtractionCompleted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionFailed extends Schema.TaggedClass<ExtractionFailed>()(
	'ExtractionFailed',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class ExtractionPagePersisted extends Schema.TaggedClass<ExtractionPagePersisted>()(
	'ExtractionPagePersisted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
		storageId: Schema.String,
	},
) {}

export class HtmlMetadataExtracted extends Schema.TaggedClass<HtmlMetadataExtracted>()(
	'HtmlMetadataExtracted',
	{
		url: Schema.URL,
		jobId: Schema.String,
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

export class DocumentProcessingStarted extends Schema.TaggedClass<DocumentProcessingStarted>()(
	'DocumentProcessingStarted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingCompleted extends Schema.TaggedClass<DocumentProcessingCompleted>()(
	'DocumentProcessingCompleted',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentProcessingFailed extends Schema.TaggedClass<DocumentProcessingFailed>()(
	'DocumentProcessingFailed',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentDownloaded extends Schema.TaggedClass<DocumentDownloaded>()(
	'DocumentDownloaded',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DocumentStored extends Schema.TaggedClass<DocumentStored>()(
	'DocumentStored',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
		storageId: Schema.String,
	},
) {}

export class EmbeddingsCreated extends Schema.TaggedClass<EmbeddingsCreated>()(
	'EmbeddingsCreated',
	{
		url: Schema.URL,
		jobId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export const HarvestingEvent = Schema.Union(
	DiscoveryStarted, // Status
	DiscoveryCompleted, // Status
	DiscoveryFailed, // Status
	PageDiscovered, // Send to Extraction workflow
	ExtractionStarted, // Status
	ExtractionCompleted, // Status
	ExtractionFailed, // Status
	ExtractionPagePersisted, // Status
	HtmlMetadataExtracted, // Status
	DocumentDiscovered, // Send to Document Processing workflow
	DocumentProcessingStarted, // Status
	DocumentProcessingCompleted, // Status
	DocumentProcessingFailed, // Status
	DocumentDownloaded, // Status
	DocumentStored, // Status
	EmbeddingsCreated, // Status
)
export type HarvestingEvent = typeof HarvestingEvent.Type
