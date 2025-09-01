import { Effect, Stream } from 'effect'

import { DiscoveryJob } from '@/discovery/workflow'

export class DiscoveryJobs extends Effect.Service<DiscoveryJobs>()(
	'DiscoveryJobs',
	{
		succeed: {
			// TODO: Implement. Probably overkill but it could be a nice optimization to
			// stream in jobs from the database lazily instead of loading all at once.
			load: Stream.fromIterable<DiscoveryJob>([
				new DiscoveryJob({
					url: new URL('https://contractaciopublica.cat/ca/inici'),
				}),
			]),
			// TODO: CRUD for discovery jobs maybe?
		},
	},
) {
	static readonly load = Stream.unwrapScoped(DiscoveryJobs.use(_ => _.load))
}
