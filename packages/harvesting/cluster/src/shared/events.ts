import { Schema } from 'effect'

import { DiscoveryEvent } from '../discovery/events.js'
import { DocumentProcessingEvent } from '../document-processor/events.js'
import { ExtractionEvent } from '../extraction/events.js'

export const HarvestingEvent = Schema.Union(
	DiscoveryEvent,
	DocumentProcessingEvent,
	ExtractionEvent,
)
export type HarvestingEvent = typeof HarvestingEvent.Type
