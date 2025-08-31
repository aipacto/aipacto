import { Effect } from 'effect'

import type { HarvestingEvent } from './events'

export class EventBus extends Effect.Tag('EventBus')<
	EventBus,
	{
		publish(event: HarvestingEvent): Effect.Effect<void>
	}
>() {}
