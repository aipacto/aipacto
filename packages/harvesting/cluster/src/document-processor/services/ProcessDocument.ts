import { Effect } from 'effect'

// TODO: Implement
export class ProcessDocument extends Effect.Service<ProcessDocument>()(
	'ProcessDocument',
	{
		succeed: {
			process: Effect.succeed({}),
		},
	},
) {
	static readonly process = ProcessDocument.use(service => service.process)
}
