import { Effect, PrimaryKey } from 'effect'

import { Discovery, type DiscoveryJob } from '@/discovery/workflow'
import { Browser, Browsers } from '@/shared/browsers'
import { Publisher } from '@/shared/publisher'
import {
	DiscoveryCompleted,
	DiscoveryFailed,
	DiscoveryStarted,
	PageDiscovered,
} from '../events'

export const runDiscoveryWorkflow = Effect.fn('DiscoveryWorkflow')(
	function* (job: DiscoveryJob, executionId: string) {
		const response = yield* Browser.withPage(browser =>
			browser.goto(job.url.href, { waitUntil: 'networkidle' }),
		)

		if (!response || !response.ok()) {
			// TODO: Better error handling
			return yield* Effect.dieMessage(`Failed to visit URL: ${job.url.href}`)
		}

		// TODO: Establish a loop to find all links to pages we want to extract information and documents from
		// Perform searches, filter, sort, paginate, etc
		// Goal: Find all links to pages we want to extract information and documents from

		// TODO: Some sites with pagination will be 100% JS and won't have links/urls to restart from
		// Consider detecting (or stating in job somehow) if we can utilize Activities to restart a workflow
		// from a certain point, or if we need to replay a sequence of actions for JS.

		yield* Publisher.publish(PageDiscovered, {
			discoveryId: PrimaryKey.value(job),
			executionId,
			url: new URL(
				'https://contractaciopublica.cat/ca/detall-publicacio/8b1ad818-3d5d-4bc7-8e7c-6937a47031ce/300470174',
			),
		})
	},
	Browsers.acquire,
	Publisher.trace({
		jobKey: 'discoveryId',
		Start: DiscoveryStarted,
		End: DiscoveryCompleted,
		Fail: DiscoveryFailed,
	}),
)

export const DiscoveryWorkflow = Discovery.toLayer(runDiscoveryWorkflow)
