import { Workflow } from '@effect/workflow'
import { PrimaryKey, Schema } from 'effect'

export class ExtractionJob extends Schema.Class<ExtractionJob>('ExtractionJob')(
	{
		url: Schema.URL,
	},
) {
	[PrimaryKey.symbol]() {
		return this.url.href
	}
}

export const Extraction = Workflow.make({
	name: 'Extraction',
	payload: ExtractionJob,
	idempotencyKey: PrimaryKey.value,
})
