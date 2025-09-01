import { Workflow } from '@effect/workflow'
import { PrimaryKey, Schema } from 'effect'

import { BrowserError } from '@/shared/browsers'

export class ExtractionJob extends Schema.Class<ExtractionJob>('ExtractionJob')(
	{
		url: Schema.URL,
	},
) {
	[PrimaryKey.symbol]() {
		return this.url.href
	}
}

// TODO: Better error handling
export const ExtractionError = Schema.Union(BrowserError)

export const Extraction = Workflow.make({
	name: 'Extraction',
	payload: ExtractionJob,
	error: ExtractionError,
	idempotencyKey: PrimaryKey.value,
})
