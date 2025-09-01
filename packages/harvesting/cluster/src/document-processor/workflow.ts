import { Workflow } from '@effect/workflow'
import { PrimaryKey, Schema } from 'effect'

export class DocumentProcessingJob extends Schema.Class<DocumentProcessingJob>(
	'DocumentProcessingJob',
)({
	documentId: Schema.String,
}) {
	[PrimaryKey.symbol]() {
		return this.documentId
	}
}

// TODO: Better error handling
export const DocumentProcessingError = Schema.Union()

export const DocumentProcessing = Workflow.make({
	name: 'DocumentProcessing',
	payload: DocumentProcessingJob,
	error: DocumentProcessingError,
	idempotencyKey: PrimaryKey.value,
})
