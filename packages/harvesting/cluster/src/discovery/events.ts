import { Schema } from 'effect'

export class DiscoveryStarted extends Schema.TaggedClass<DiscoveryStarted>()(
	'DiscoveryStarted',
	{
		discoveryId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
	},
) {}

export class DiscoveryCompleted extends Schema.TaggedClass<DiscoveryCompleted>()(
	'DiscoveryCompleted',
	{
		discoveryId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
		// pagesDiscovered: Schema.Number,
	},
) {}

export class DiscoveryFailed extends Schema.TaggedClass<DiscoveryFailed>()(
	'DiscoveryFailed',
	{
		discoveryId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
		error: Schema.String,
	},
) {}

export class PageDiscovered extends Schema.TaggedClass<PageDiscovered>()(
	'PageDiscovered',
	{
		discoveryId: Schema.String,
		executionId: Schema.String,
		timestamp: Schema.Date,
		url: Schema.URL,
	},
) {}

export const DiscoveryEvent = Schema.Union(
	DiscoveryStarted,
	DiscoveryCompleted,
	DiscoveryFailed,
	PageDiscovered,
)
export type DiscoveryEvent = typeof DiscoveryEvent.Type
