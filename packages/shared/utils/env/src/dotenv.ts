import { config } from 'dotenv'
import { Context, Data, Effect, Layer } from 'effect'

export class ErrorDotenv extends Data.TaggedError('ErrorDotenv')<{
	message: string
}> {}

const make = {
	config: ({ path }: { readonly path: string }) =>
		Effect.gen(function* () {
			const output = yield* Effect.sync(() => config({ path }))
			if (output.parsed === undefined || output.error !== undefined) {
				return yield* new ErrorDotenv({
					message:
						output.error instanceof Error
							? output.error.message
							: "Env variables couldn't be loaded",
				})
			}

			// yield* Effect.log('Loaded env', path, output.parsed)

			return output.parsed
		}),
}

export class Dotenv extends Context.Tag('Dotenv')<Dotenv, typeof make>() {
	static readonly Live = Layer.succeed(this, make)
}
