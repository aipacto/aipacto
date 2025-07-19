import { type Client, createClient } from '@libsql/client'
import { Config, Data, Effect, Redacted } from 'effect'

export class ErrorDbConnectionFailed extends Data.TaggedError(
	'ErrorDbConnectionFailed',
)<{
	message: string
}> {}

export class ErrorDbExecutionFailed extends Data.TaggedError(
	'ErrorDbExecutionFailed',
)<{
	message: string
}> {}

export class Database extends Effect.Service<Database>()('Database', {
	accessors: true,
	scoped: Effect.gen(function* () {
		const url = yield* Config.string('DATABASE_URL')

		Effect.log('Starting database connection')

		let client: Client
		if (process.env.NODE_ENV === 'production') {
			const authToken = yield* Config.redacted('DATABASE_TOKEN')

			client = createClient({
				url,
				authToken: Redacted.value(authToken),
			})
		} else {
			client = createClient({
				url,
			})
		}

		// Create tables if they don't exist
		yield* Effect.tryPromise(() =>
			client.execute(`
          CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            snapshot BLOB NOT NULL
          );
          CREATE TABLE IF NOT EXISTS document_history (
            doc_id TEXT,
            version_id TEXT,
            version JSON NOT NULL,
            timestamp INTEGER NOT NULL,
            author TEXT NOT NULL,
            message TEXT,
            PRIMARY KEY (doc_id, version_id),
            FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
          );
        `),
		)

		const execute = (sql: string, params: any[] = []) =>
			Effect.tryPromise({
				try: () => client.execute(sql, params),
				catch: error => {
					console.error('Database execute error:', {
						error: error instanceof Error ? error.message : String(error),
						sql: sql,
						params: params?.length || 0,
					})

					return new ErrorDbExecutionFailed({
						message: 'Database operation failed',
					})
				},
			})

		const batch = (statements: string[]) =>
			Effect.tryPromise(() => client.batch(statements))

		return {
			execute,
			batch,
			client,
		} as const
	}),
}) {}
