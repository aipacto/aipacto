import { Schema } from 'effect'

import { DiscoveryEvent } from '../discovery/events'
import { DocumentProcessingEvent } from '../document-processor/events'
import { ExtractionEvent } from '../extraction/events'

export const HarvestingEvent = Schema.Union(
	DiscoveryEvent,
	DocumentProcessingEvent,
	ExtractionEvent,
)
export type HarvestingEvent = typeof HarvestingEvent.Type
