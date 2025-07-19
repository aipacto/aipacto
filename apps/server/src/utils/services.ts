import { Layer, ManagedRuntime } from 'effect'

import { LoroDocumentService } from '../docs/loro'
import { Database } from './database'

const MainLayer = Layer.mergeAll(LoroDocumentService.Live).pipe(
	Layer.provide(Database.Default),
)

export const RuntimeClient = ManagedRuntime.make(MainLayer)
