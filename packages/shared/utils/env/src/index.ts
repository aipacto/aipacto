import { logSharedUtils } from '@aipacto/shared-utils-logging'
import { Path } from '@effect/platform'
import { NodePath } from '@effect/platform-node'
import { Effect, Layer } from 'effect'

import { Dotenv } from './dotenv'

const log = logSharedUtils.getChildCategory('utils/env')

const make = Effect.map(
	Effect.all({
		dotenv: Dotenv,
		path: Path.Path,
	}),
	({ dotenv, path }) => ({
		load: Effect.gen(function* () {
			const env = process.env.NODE_ENV || 'development'
			const envFile = `.env.${env}`
			const envPath = path.resolve(process.cwd(), envFile)
			const defaultEnvFile = '.env'
			const defaultPath = path.resolve(process.cwd(), defaultEnvFile)

			log.debug('Loading environment variables')

			// Try environment-specific file first, then default, then skip if both missing
			yield* dotenv.config({ path: envPath }).pipe(
				Effect.catchTag('ErrorDotenv', () =>
					dotenv.config({ path: defaultPath }).pipe(
						Effect.catchTag('ErrorDotenv', () => {
							log.debug('No .env files found, using process.env')
							return Effect.void
						}),
					),
				),
			)
		}),
	}),
)

export class Env extends Effect.Tag('Env')<
	Env,
	Effect.Effect.Success<typeof make>
>() {
	static readonly Live = Layer.effect(this, make).pipe(
		Layer.provide(Layer.mergeAll(Dotenv.Live, NodePath.layer)),
	)
}
