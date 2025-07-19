import { Context, Data, Effect, Layer, Option } from 'effect'
import { type ExportMode, LoroDoc, VersionVector } from 'loro-crdt'

import { Database } from '../utils/database'

export interface DocumentVersion {
	id: string
	version: VersionVector
	timestamp: number
	author: string
	message?: string
}

export interface DocumentSnapshot {
	id: string
	data: Uint8Array
	version: VersionVector
	createdAt: Date
}

export class ErrorDocumentNotFound extends Data.TaggedError(
	'ErrorDocumentNotFound',
)<{
	message: string
}> {}

export class ErrorDocumentAlreadyExists extends Data.TaggedError(
	'ErrorDocumentAlreadyExists',
)<{
	message: string
}> {}

export class ErrorInvalidPeerId extends Data.TaggedError(
	'ErrorInvalidPeerId',
) {}

// Helper function to generate a unique peer ID from document ID
const generatePeerId = (id: string) => {
	// Generate a consistent numeric peer ID from the string ID
	// A simple hash function to convert string to number
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		const char = id.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32-bit integer
	}
	// Ensure it's a positive integer
	const peerId = Math.abs(hash)
	return Effect.succeed(peerId)
}

// Add these helpers for VersionVector serialization
const serializeVersionVector = (vv: VersionVector): string => {
	// `VersionVector` doesn't expose iteration helpers directly, but `toJSON()`
	// gives us the underlying `Map<PeerID, number>` which we can safely iterate
	// over. We then stringify a simple array representation to store it in the
	// database.
	const entries = Array.from(vv.toJSON().entries()).map(([peer, counter]) => [
		peer.toString(),
		counter,
	])
	return JSON.stringify(entries)
}

const deserializeVersionVector = (json: string): VersionVector => {
	const arr = JSON.parse(json) as [string, number][]
	// Build a Map<PeerID, number> ensuring the key matches the literal `${number}` type
	const map = new Map<`${number}`, number>(
		arr.map(([peer, counter]) => [peer as `${number}`, counter]),
	)
	return VersionVector.parseJSON(map)
}

const make = Effect.gen(function* () {
	const db = yield* Database
	const documents = new Map<string, LoroDoc>()
	const documentHistory = new Map<string, DocumentVersion[]>()
	type UserSelection = Record<string, unknown>
	const activeSelections = new Map<string, Map<string, UserSelection>>()

	// Load all documents from database on startup
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

			// Load history
			const hist = yield* db.execute(
				'SELECT * FROM document_history WHERE doc_id = ? ORDER BY timestamp',
				[id],
			)
			const history: DocumentVersion[] = hist.rows.map(row => ({
				id: row.version_id as string,
				version: deserializeVersionVector(row.version as string),
				timestamp: row.timestamp as number,
				author: row.author as string,
				...(row.message != null ? { message: row.message as string } : {}),
			}))
			documentHistory.set(id, history)

			activeSelections.set(id, new Map<string, UserSelection>()) // Transient, not persisted
		} catch (error) {
			console.error(`Failed to load document ${id} ${JSON.stringify(error)}`)
		}
	}

	const createDocument = (id: string) =>
		Effect.if(documents.has(id), {
			// Document does not exist
			onFalse: () =>
				Effect.gen(function* () {
					const peerId = yield* generatePeerId(id)
					const doc = new LoroDoc()

					doc.setPeerId(peerId)
					documents.set(id, doc)
					documentHistory.set(id, [])
					activeSelections.set(id, new Map<string, UserSelection>())

					// Save initial empty snapshot
					const initialSnapshot = doc.export({ mode: 'snapshot' })
					yield* db.execute(
						'INSERT INTO documents (id, snapshot) VALUES (?, ?)',
						[id, initialSnapshot],
					)

					return doc
				}),
			// Document already exists
			onTrue: () =>
				new ErrorDocumentAlreadyExists({
					message: `Document ${id} already exists`,
				}),
		})

	const getDocument = (id: string) =>
		Effect.sync(() => {
			const doc = documents.get(id)
			return doc ? Option.some(doc) : Option.none()
		})

	const deleteDocument = (id: string) =>
		Effect.gen(function* () {
			yield* db.execute('DELETE FROM documents WHERE id = ?', [id])
			yield* db.execute('DELETE FROM document_history WHERE doc_id = ?', [id])
			documents.delete(id)
			documentHistory.delete(id)
			activeSelections.delete(id)
		})

	const applyUpdate = (docId: string, update: Uint8Array, author: string) =>
		Effect.gen(function* () {
			const docOption = yield* getDocument(docId)

			if (Option.isNone(docOption)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${docId} not found` }),
				)
			}

			const doc = docOption.value

			// Import the update
			doc.import(update)

			// Create version entry
			const version: DocumentVersion = {
				id: `${docId}-${Date.now()}`,
				version: doc.version(),
				timestamp: Date.now(),
				author,
			}

			// Add to history
			const history = documentHistory.get(docId) || []
			history.push(version)
			documentHistory.set(docId, history)

			// Save updated snapshot - create row if it doesn't exist
			const newSnapshot = doc.export({ mode: 'snapshot' })
			yield* db.execute(
				'INSERT OR REPLACE INTO documents (id, snapshot) VALUES (?, ?)',
				[docId, newSnapshot],
			)

			// Save history entry
			yield* db.execute(
				'INSERT INTO document_history (doc_id, version_id, version, timestamp, author, message) VALUES (?, ?, ?, ?, ?, ?)',
				[
					docId,
					version.id,
					serializeVersionVector(version.version),
					version.timestamp,
					version.author,
					version.message,
				],
			)

			return version
		})

	const getUpdates = (docId: string, fromVersion?: VersionVector) =>
		Effect.gen(function* () {
			const docOption = yield* getDocument(docId)

			if (Option.isNone(docOption)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${docId} not found` }),
				)
			}

			const doc = docOption.value

			const exportMode: ExportMode = fromVersion
				? { mode: 'update', from: fromVersion }
				: { mode: 'update' }

			return doc.export(exportMode)
		})

	const createSnapshot = (docId: string) =>
		Effect.gen(function* () {
			const docOption = yield* getDocument(docId)

			if (Option.isNone(docOption)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${docId} not found` }),
				)
			}

			const doc = docOption.value
			const data = doc.export({ mode: 'snapshot' })

			return {
				id: `snapshot-${docId}-${Date.now()}`,
				data,
				version: doc.version(),
				createdAt: new Date(),
			}
		})

	const loadSnapshot = (docId: string, snapshot: Uint8Array) =>
		Effect.gen(function* () {
			// Create new document or get existing
			let doc = documents.get(docId)

			if (!doc) {
				const peerId = yield* generatePeerId(docId)
				doc = new LoroDoc()
				doc.setPeerId(peerId)
				documents.set(docId, doc)
				documentHistory.set(docId, [])
				activeSelections.set(docId, new Map<string, UserSelection>())
			}

			// Import snapshot
			doc.import(snapshot)

			// Persist the loaded snapshot
			const newSnapshot = doc.export({ mode: 'snapshot' })
			yield* db.execute(
				'INSERT OR REPLACE INTO documents (id, snapshot) VALUES (?, ?)',
				[docId, newSnapshot],
			)

			// Note: History isn't updated here; caller should handle if needed
		})

	const getHistory = (docId: string) =>
		Effect.sync(() => {
			return documentHistory.get(docId) || []
		})

	const checkout = (docId: string, version: VersionVector) =>
		Effect.gen(function* () {
			const docOption = yield* getDocument(docId)

			if (Option.isNone(docOption)) {
				return yield* Effect.fail(
					new ErrorDocumentNotFound({ message: `Document ${docId} not found` }),
				)
			}

			const doc = docOption.value
			doc.checkout(doc.vvToFrontiers(version))
		})

	const updateSelection = (
		docId: string,
		userId: string,
		selection: UserSelection,
	) =>
		Effect.sync(() => {
			const selections =
				activeSelections.get(docId) || new Map<string, UserSelection>()
			selections.set(userId, selection)
			activeSelections.set(docId, selections)
		})

	const getActiveSelections = (docId: string) =>
		Effect.sync(() => {
			return activeSelections.get(docId) || new Map<string, UserSelection>()
		})

	const listDocuments = () =>
		Effect.sync(() => {
			const docList = Array.from(documents.keys()).map(id => {
				try {
					const doc = documents.get(id)
					return {
						id,
						hasContent: doc !== undefined,
						historyCount: (documentHistory.get(id) || []).length,
						activeSelectionsCount: (activeSelections.get(id) || new Map()).size,
					}
				} catch (error) {
					console.error(`Error processing document ${id} in list:`, error)
					return {
						id,
						hasContent: false,
						historyCount: 0,
						activeSelectionsCount: 0,
						error: 'Document corrupted',
					}
				}
			})
			return docList
		})

	return {
		createDocument,
		getDocument,
		deleteDocument,
		applyUpdate,
		getUpdates,
		createSnapshot,
		loadSnapshot,
		getHistory,
		checkout,
		updateSelection,
		getActiveSelections,
		listDocuments,
	} as const
})

export class LoroDocumentService extends Context.Tag('LoroDocumentService')<
	typeof make,
	Effect.Effect.Success<typeof make>
>() {
	static readonly Live = Layer.effect(this, make)
}
