import { Effect } from 'effect'

import { Extraction, type ExtractionJob } from '@/extraction/workflow'
import { Browser, Browsers } from '@/shared/browsers'
import { Publisher } from '@/shared/publisher'
import {
	DocumentDownloaded,
	ExtractionCompleted,
	ExtractionFailed,
	ExtractionStarted,
	HtmlMetadataExtracted,
} from '../events.js'
import { ExtractHtmlMetadata } from './ExtractHtmlMetadata.js'

export const runExtractionWorkflow = Effect.fn('ExtractionWorkflow')(
	function* (job: ExtractionJob, executionId: string) {
		const response = yield* Browser.withPage(browser =>
			browser.goto(job.url.href, { waitUntil: 'networkidle' }),
		)

		if (!response || !response.ok()) {
			// TODO: Better error handling
			return yield* Effect.dieMessage(`Failed to visit URL: ${job.url.href}`)
		}

		// Extract HTML metadata
		// TODO: We need to actually pass something here
		// TODO: Utilize Activity
		const metadata = yield* ExtractHtmlMetadata.extract

		yield* Publisher.publish(HtmlMetadataExtracted, {
			executionId,
			url: job.url,
			metadata,
		})

		// TODO: Establish a loop to download all documents

		yield* Publisher.publish(DocumentDownloaded, {
			executionId,
			documentId: 'TODO',
		})
	},
	Browsers.acquire,
	Publisher.trace({
		jobKey: 'extractionId',
		Start: ExtractionStarted,
		End: ExtractionCompleted,
		Fail: ExtractionFailed,
	}),
)

export const ExtractionWorkflow = Extraction.toLayer(runExtractionWorkflow)
