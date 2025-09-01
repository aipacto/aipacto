import { Config, Context, Effect, Layer, pipe, Schema } from 'effect'
import { toStringUnknown } from 'effect/Inspectable'
import * as Playwright from 'playwright'

// TODO: What else is worth configuring via env vars?
export const BrowsersConfig = pipe(
	Config.all({
		max: pipe(Config.integer('MAX'), Config.withDefault(4)),
		headless: pipe(Config.boolean('HEADLESS'), Config.withDefault(true)),
	}),
	Config.nested('BROWSERS'),
)

/**
 * Browsers is configured per cluster node to limit the total number of browsers accessed
 * at one time.
 */
export class Browsers extends Effect.Service<Browsers>()('Browsers', {
	effect: Effect.gen(function* () {
		const { max, headless } = yield* BrowsersConfig

		// TODO: Improve the settings for the browser and its context
		const launch = Effect.tryPromise({
			try: async () => {
				// TODO: Do we need any othe browser type?
				const browser = await Playwright.chromium.launch({ headless })
				const context = await browser.newContext()
				const page = context.pages()[0] || (await context.newPage())

				return {
					browser,
					context,
					page,
				}
			},
			catch: error =>
				new BrowserError({
					context: 'launch',
					message: toStringUnknown(error),
					cause: error,
				}),
		}).pipe(
			Effect.acquireRelease(({ browser, context, page }) =>
				Effect.promise(async () => {
					await page.close()
					await context.close()
					await browser.close()
				}),
			),
			Effect.withSpan('Browsers.get'),
		)
		const semaphore = yield* Effect.makeSemaphore(max)
		const acquire = Effect.acquireRelease(semaphore.take(1), () =>
			semaphore.release(1),
		)

		return {
			launch: Layer.scoped(
				Browser,
				Effect.gen(function* () {
					yield* acquire
					return Browser.fromPlaywright(yield* launch)
				}),
			),
		}
	}),
}) {
	static launch = Layer.unwrapScoped(Browsers.use(browsers => browsers.launch))

	static acquire = <A, E, R>(
		effect: Effect.Effect<A, E, R>,
	): Effect.Effect<A, E | BrowserError, Exclude<R, Browser> | Browsers> =>
		Effect.provide(effect, Browsers.launch)
}

export class BrowserError extends Schema.TaggedError<BrowserError>()(
	'BrowserError',
	{
		context: Schema.Literal('launch', 'context', 'page', 'browser'),
		message: Schema.String,
		cause: Schema.Unknown,
	},
) {}

export class Browser extends Context.Tag('Browser')<
	Browser,
	{
		readonly withBrowser: <A>(
			f: (browser: Playwright.Browser, signal: AbortSignal) => A | Promise<A>,
		) => Effect.Effect<A, BrowserError>

		readonly withContext: <A>(
			f: (
				context: Playwright.BrowserContext,
				signal: AbortSignal,
			) => A | Promise<A>,
		) => Effect.Effect<A, BrowserError>

		readonly withPage: <A>(
			f: (page: Playwright.Page, signal: AbortSignal) => A | Promise<A>,
		) => Effect.Effect<A, BrowserError>
	}
>() {
	static readonly fromPlaywright = (params: {
		browser: Playwright.Browser
		context: Playwright.BrowserContext
		page: Playwright.Page
	}): Browser['Type'] => ({
		withBrowser: f =>
			Effect.tryPromise({
				try: signal => Promise.resolve(f(params.browser, signal)),
				catch: error =>
					new BrowserError({
						context: 'browser',
						message: toStringUnknown(error),
						cause: error,
					}),
			}),
		withContext: f =>
			Effect.tryPromise({
				try: signal => Promise.resolve(f(params.context, signal)),
				catch: error =>
					new BrowserError({
						context: 'context',
						message: toStringUnknown(error),
						cause: error,
					}),
			}),
		withPage: f =>
			Effect.tryPromise({
				try: signal => Promise.resolve(f(params.page, signal)),
				catch: error =>
					new BrowserError({
						context: 'page',
						message: toStringUnknown(error),
						cause: error,
					}),
			}),
	})

	static readonly withPage = <A>(
		f: (page: Playwright.Page, signal: AbortSignal) => A | Promise<A>,
	) => Effect.flatMap(Browser, browser => browser.withPage(f))

	static readonly withContext = <A>(
		f: (
			context: Playwright.BrowserContext,
			signal: AbortSignal,
		) => A | Promise<A>,
	) => Effect.flatMap(Browser, browser => browser.withContext(f))

	static readonly withBrowser = <A>(
		f: (browser: Playwright.Browser, signal: AbortSignal) => A | Promise<A>,
	) => Effect.flatMap(Browser, browser => browser.withBrowser(f))
}
