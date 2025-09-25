import { Deferment, DefermentManager } from '../deferment/defermentManager.js'
import { MemoryOnlyDeferment } from '../deferment/MemoryOnlyDeferment.js'
import { DisabledDeferment } from '../deferment/DisabledDeferment.js'
import {
  CustomLogger,
  Fetcher,
  getFeatureFlag,
  ObjectLoader2Flags
} from '../types/functions.js'
import { Base, ObjectAttributeMask } from '../types/types.js'
import { Database } from './interfaces.js'
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
  useGetObject?: boolean //defaults to true
  logger?: CustomLogger
}

export interface ObjectLoader2FactoryParams {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers
  options?: ObjectLoader2FactoryOptions
  attributeMask?: ObjectAttributeMask
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

  static createFromUrl(params: ObjectLoader2FactoryParams): ObjectLoader2 {
    const logger = this.getLogger(params.options?.logger)
    const database = this.getDatabase(params)
    const deferments = this.getDeferment(params, logger)
    const loader = new ObjectLoader2({
      rootId: params.objectId,
      deferments,
      downloader: new ServerDownloader({
        serverUrl: params.serverUrl,
        streamId: params.streamId,
        objectId: params.objectId,
        token: params.token,
        headers: params.headers,
        fetch: params.options?.fetch,
        attributeMask: params.attributeMask,
        logger
      }),
      database,
      logger,
      useGetObject: params.options?.useGetObject
    })
    return loader
  }

  static getLogger(providedLogger?: CustomLogger): CustomLogger {
    if (getFeatureFlag(ObjectLoader2Flags.DEBUG) === 'true') {
      return providedLogger || this.logger
    }
    return providedLogger || (((): void => {}) as CustomLogger)
  }

  static logger: CustomLogger = (m?: string, ...optionalParams: unknown[]) => {
    console.log(`[debug] ${m}`, ...optionalParams)
  }

  static getDatabase(params: ObjectLoader2FactoryParams): Database {
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
      return new IndexedDatabase({
        indexedDB: params.options?.indexedDB,
        keyRange: params.options?.keyRange
      })
    } else {
      return new MemoryDatabase({
        items: new Map<string, Base>()
      })
      this.logger(
        'Disabled persistent caching for ObjectLoader2.  Using MemoryDatabase'
      )
    }
  }

  static getDeferment(
    params: ObjectLoader2FactoryParams,
    logger: CustomLogger
  ): Deferment {
    const useGetObject = params.options?.useGetObject ?? true

    if (useGetObject) {
      logger('Using cached deferment for ObjectLoader2Factory')
      return new DefermentManager(logger)
    } else {
      logger('Disabled caching for ObjectLoader2. Using MemoryOnlyDeferment')
      return new DisabledDeferment()
    }
  }
}
