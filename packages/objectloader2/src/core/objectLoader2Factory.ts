import { DefermentManager, MemoryOnlyDeferment } from '../deferment/defermentManager.js'
import {
  CustomLogger,
  Fetcher,
  getFeatureFlag,
  ObjectLoader2Flags
} from '../types/functions.js'
import { Base, ObjectAttributeMask } from '../types/types.js'
import { ObjectLoader2 } from './objectLoader2.js'
import { IndexedDatabase } from './stages/indexedDatabase.js'
import { MemoryDatabase } from './stages/memory/memoryDatabase.js'
import { MemoryDownloader } from './stages/memory/memoryDownloader.js'
import ServerDownloader from './stages/serverDownloader.js'

export interface ObjectLoader2FactoryOptions {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
  fetch?: Fetcher
  attributeMask?: ObjectAttributeMask
  useCache?: boolean
  debug?: boolean
  logger?: CustomLogger
}

export class ObjectLoader2Factory {
  static createFromObjects(objects: Base[]): ObjectLoader2 {
    const root = objects[0]
    const records: Map<string, Base> = new Map<string, Base>()
    objects.forEach((element) => {
      records.set(element.id, element)
    })
    const loader = new ObjectLoader2({
      rootId: root.id,
      deferments: new MemoryOnlyDeferment(records),
      database: new MemoryDatabase({ items: records }),
      downloader: new MemoryDownloader(root.id, records)
    })
    return loader
  }

  static createFromJSON(json: string): ObjectLoader2 {
    const jsonObj = JSON.parse(json) as Base[]
    return this.createFromObjects(jsonObj)
  }

  static createFromUrl(params: {
    serverUrl: string
    streamId: string
    objectId: string
    token?: string
    headers?: Headers
    options?: ObjectLoader2FactoryOptions
    attributeMask?: ObjectAttributeMask
    objectTypeMask?: string[]
  }): ObjectLoader2 {
    const log = ObjectLoader2Factory.getLogger(params.options?.logger)
    let database
    if (
      params.options?.debug === true ||
      getFeatureFlag(ObjectLoader2Flags.DEBUG) === 'true'
    ) {
      this.logger('Using DEBUG mode for ObjectLoader2Factory')
    }
    const useCache = params.options?.useCache ?? true
    const flag = getFeatureFlag(ObjectLoader2Flags.USE_CACHE)
    const flagAllowsCache = flag !== 'false'

    if (useCache && flagAllowsCache) {
      database = new IndexedDatabase({
        indexedDB: params.options?.indexedDB,
        keyRange: params.options?.keyRange
      })
    } else {
      database = new MemoryDatabase({
        items: new Map<string, Base>()
      })
      this.logger(
        'Disabled persistent caching for ObjectLoader2.  Using MemoryDatabase'
      )
    }
    const logger = log || (((): void => {}) as CustomLogger)
    const loader = new ObjectLoader2({
      rootId: params.objectId,
      deferments: new DefermentManager(logger),
      downloader: new ServerDownloader({
        serverUrl: params.serverUrl,
        streamId: params.streamId,
        objectId: params.objectId,
        token: params.token,
        headers: params.headers,
        fetch: params.options?.fetch,
        attributeMask: params.attributeMask,
        objectTypeMask: params.objectTypeMask,
        logger
      }),
      database,
      logger
    })
    return loader
  }

  static getLogger(providedLogger?: CustomLogger): CustomLogger | undefined {
    if (getFeatureFlag(ObjectLoader2Flags.DEBUG) === 'true') {
      return providedLogger || this.logger
    }
    return providedLogger
  }

  static logger: CustomLogger = (m?: string, ...optionalParams: unknown[]) => {
    console.log(`[debug] ${m}`, ...optionalParams)
  }
}
