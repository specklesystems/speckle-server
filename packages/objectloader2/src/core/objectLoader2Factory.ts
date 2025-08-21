import { CustomLogger, getFeatureFlag, ObjectLoader2Flags } from '../types/functions.js'
import { Base } from '../types/types.js'
import { ObjectLoader2 } from './objectLoader2.js'
import IndexedDatabase from './stages/indexedDatabase.js'
import { MemoryDatabase } from './stages/memory/memoryDatabase.js'
import { MemoryDownloader } from './stages/memory/memoryDownloader.js'
import ServerDownloader from './stages/serverDownloader.js'

export interface ObjectLoader2FactoryOptions {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
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
  }): ObjectLoader2 {
    const log = ObjectLoader2Factory.getLogger(params.options?.logger)
    let database
    if (getFeatureFlag(ObjectLoader2Flags.DEBUG) === 'true') {
      this.logger('Using DEBUG mode for ObjectLoader2Factory')
    }
    if (getFeatureFlag(ObjectLoader2Flags.USE_CACHE) === 'true') {
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
    const loader = new ObjectLoader2({
      rootId: params.objectId,
      downloader: new ServerDownloader({
        serverUrl: params.serverUrl,
        streamId: params.streamId,
        objectId: params.objectId,
        token: params.token,
        headers: params.headers
      }),
      database,
      logger: log
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
