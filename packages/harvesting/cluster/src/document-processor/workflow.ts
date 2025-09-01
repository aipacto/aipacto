import { Workflow } from '@effect/workflow'
import { PrimaryKey, Schema } from 'effect'

export class DocumentProcessingJob extends Schema.Class<DocumentProcessingJob>(
	'DocumentProcessingJob',
)({
	url: Schema.URL,
}) {
	[PrimaryKey.symbol]() {
		return this.url.href
	}
}

export const DocumentProcessing = Workflow.make({
	name: 'DocumentProcessing',
	payload: DocumentProcessingJob,
	idempotencyKey: PrimaryKey.value,
})
