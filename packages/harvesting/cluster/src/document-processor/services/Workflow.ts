import { Effect } from 'effect'

import {
	DocumentProcessing,
	type DocumentProcessingJob,
} from '@/document-processor/workflow'
import { Publisher } from '@/shared/publisher'
import {
	DocumentMetadataExtracted,
	DocumentProcessingCompleted,
	DocumentProcessingFailed,
	DocumentProcessingStarted,
} from '../events'
import { ProcessDocument } from './ProcessDocument'

export const runDocumentProcessingWorkflow = Effect.fn(
	'DocumentProcessingWorkflow',
)(
	function* (job: DocumentProcessingJob, executionId: string) {
		// TODO: Load document from storage
		// TODO: Process document content
		const result = yield* ProcessDocument.process

		yield* Publisher.publish(DocumentMetadataExtracted, {
			documentId: job.documentId,
			executionId,
			metadata: result,
		})

		// TODO: Create embeddings
		// yield* Publisher.publish(EmbeddingsCreated, {
		// 	documentId: job.documentId,
		// 	executionId,
		// })

		// TODO: Store processed results
	},
	Publisher.trace({
		jobKey: 'documentId',
		Start: DocumentProcessingStarted,
		End: DocumentProcessingCompleted,
		Fail: DocumentProcessingFailed,
	}),
)

export const DocumentProcessingWorkflow = DocumentProcessing.toLayer(
	runDocumentProcessingWorkflow,
)
