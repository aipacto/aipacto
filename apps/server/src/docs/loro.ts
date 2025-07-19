import { Context, Data, Effect, Layer, Option } from 'effect'
import { LoroDoc, type VersionVector } from 'loro-crdt'

import { Database } from '../utils/database'

export class ErrorDocumentNotFound extends Data.TaggedError(
	'ErrorDocumentNotFound',
)<{ message: string }> {}
export class ErrorDocumentAlreadyExists extends Data.TaggedError(
	'ErrorDocumentAlreadyExists',
)<{ message: string }> {}
export class ErrorInvalidPeerId extends Data.TaggedError(
	'ErrorInvalidPeerId',
)<{}> {}

// Helper to generate peer ID from string
const generatePeerId = (id: string) => {
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i)
		hash |= 0 // Convert to 32-bit integer
	}
	return Effect.succeed(Math.abs(hash))
}

const make = Effect.gen(function* () {
	const db = yield* Database
	const documents = new Map<string, LoroDoc>()

	// Load documents from DB on startup
	const allDocs = yield* db.execute('SELECT * FROM documents')
	for (const row of allDocs.rows) {
		const id = row.id as string
		const snapshot = row.snapshot as Uint8Array
		try {
			const peerId = yield* generatePeerId(id)
			const doc = new LoroDoc()
			doc.setPeerId(peerId)
			doc.import(snapshot)
			documents.set(id, doc)
		} catch (error) {
			console.error(`Failed to load document ${id}:`, error)
		}
	}

	const createDocument = (
		id: string,
		title: string,
		description: string,
		path: string,
		userId: string,
		initialContent?: Uint8Array,
	) =>
		Effect.if(documents.has(id), {
			onTrue: () =>
				Effect.fail(
					new ErrorDocumentAlreadyExists({
						message: `Document ${id} already exists`,
					}),
				),
			onFalse: () =>
				Effect.gen(function* () {
					const peerId = yield* generatePeerId(userId)
					const doc = new LoroDoc()
					doc.setPeerId(peerId)

					// If initial content is provided, import it
					if (initialContent) {
						doc.import(initialContent)
					} else {
						// Otherwise create default structure
						const documentMap = doc.getMap('document')
						documentMap.set('title', title)
						documentMap.set('description', description)
						documentMap.set('createdAt', Date.now())
						documentMap.set('path', path)
						// Use the same doc instance for the text container
						const contentText = doc.getText('content')
						documentMap.setContainer('content', contentText)
						contentText.insert(0, '') // Initial empty content
						doc.commit()
					}

					documents.set(id, doc)
					// Save initial snapshot
					const initialSnapshot = doc.export({ mode: 'snapshot' })
					yield* db.execute(
						'INSERT INTO documents (id, snapshot) VALUES (?, ?)',
						[id, initialSnapshot],
					)
					return doc
				}),
		})

	const getDocument = (id: string) =>
		Effect.sync(() => Option.fromNullable(documents.get(id)))

	const deleteDocument = (id: string) =>
		Effect.gen(function* () {
			yield* db.execute('DELETE FROM documents WHERE id = ?', [id])
			documents.delete(id)
		})

	const applyUpdate = (id: string, update: Uint8Array, userId: string) =>
		Effect.gen(function* () {
			const docOpt = yield* getDocument(id)
			if (Option.isNone(docOpt)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${id} not found` }),
				)
			}
			const doc = docOpt.value
			doc.import(update)
			doc.commit()
			// Save updated snapshot
			const newSnapshot = doc.export({ mode: 'snapshot' })
			yield* db.execute('UPDATE documents SET snapshot = ? WHERE id = ?', [
				newSnapshot,
				id,
			])
		})

	const getUpdates = (id: string, fromVersion?: VersionVector) =>
		Effect.gen(function* () {
			const docOpt = yield* getDocument(id)
			if (Option.isNone(docOpt)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${id} not found` }),
				)
			}
			const doc = docOpt.value
			return doc.export(
				fromVersion
					? { mode: 'update', from: fromVersion }
					: { mode: 'update' },
			)
		})

	const updateMetadata = (
		id: string,
		title?: string,
		description?: string,
		path?: string,
	) =>
		Effect.gen(function* () {
			const docOpt = yield* getDocument(id)
			if (Option.isNone(docOpt)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${id} not found` }),
				)
			}
			const doc = docOpt.value
			const documentMap = doc.getMap('document')
			if (title) documentMap.set('title', title)
			if (description) documentMap.set('description', description)
			if (path) documentMap.set('path', path)
			doc.commit()
			// Save updated snapshot
			const newSnapshot = doc.export({ mode: 'snapshot' })
			yield* db.execute('UPDATE documents SET snapshot = ? WHERE id = ?', [
				newSnapshot,
				id,
			])
		})

	const listDocuments = () => Effect.sync(() => Array.from(documents.keys()))

	return {
		createDocument,
		getDocument,
		deleteDocument,
		applyUpdate,
		getUpdates,
		updateMetadata,
		listDocuments,
	} as const
})

export class LoroDocumentService extends Context.Tag('LoroDocumentService')<
	LoroDocumentService,
	Effect.Effect.Success<typeof make>
>() {
	static readonly Live = Layer.effect(this, make)
}
