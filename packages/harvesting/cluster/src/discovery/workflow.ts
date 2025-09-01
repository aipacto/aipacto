import { Workflow } from '@effect/workflow'
import { PrimaryKey, Schema } from 'effect'

import { BrowserError } from '@/shared/browsers'

export class DiscoveryJob extends Schema.Class<DiscoveryJob>('DiscoveryJob')({
	url: Schema.URL,
}) {
	[PrimaryKey.symbol]() {
		return this.url.href
	}
}

// TODO: Better error handling
export const DiscoveryError = Schema.Union(BrowserError)

export const Discovery = Workflow.make({
	name: 'Discovery',
	payload: DiscoveryJob,
	error: DiscoveryError,
	idempotencyKey: PrimaryKey.value,
})
