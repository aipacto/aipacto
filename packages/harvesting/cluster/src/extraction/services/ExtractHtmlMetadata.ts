import { Effect } from 'effect'

// TODO: Implement
export class ExtractHtmlMetadata extends Effect.Service<ExtractHtmlMetadata>()(
	'ExtractHtmlMetadata',
	{
		succeed: {
			extract: Effect.succeed({}),
		},
	},
) {
	static readonly extract = ExtractHtmlMetadata.use(service => service.extract)
}
