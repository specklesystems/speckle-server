import { canUseWorkers, CustomLogger, getQueryParameter } from '../types/functions.js'
import { Base } from '../types/types.js'
import { ObjectLoader2 } from './objectLoader2.js'
import IndexedDatabase from './stages/indexedDatabase.js'
import { MemoryDatabase } from './stages/memory/memoryDatabase.js'
import { MemoryDownloader } from './stages/memory/memoryDownloader.js'
import ServerDownloader from './stages/serverDownloader.js'

export interface ObjectLoader2FactoryOptions {
  useMemoryCache?: boolean
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
  logger2?: CustomLogger
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
    const log = ObjectLoader2Factory.getLogger(params.options?.logger2)
    let loader: ObjectLoader2
    if (params.options?.useMemoryCache) {
      loader = new ObjectLoader2({
        rootId: params.objectId,
        downloader: new ServerDownloader({
          serverUrl: params.serverUrl,
          streamId: params.streamId,
          objectId: params.objectId,
          token: params.token,
          headers: params.headers
        }),
        database: new MemoryDatabase({
          items: new Map<string, Base>()
        }),
        logger: log
      })
    } else {
      loader = new ObjectLoader2({
        rootId: params.objectId,
        downloader: new ServerDownloader({
          serverUrl: params.serverUrl,
          streamId: params.streamId,
          objectId: params.objectId,
          token: params.token,
          headers: params.headers
        }),
        database: new IndexedDatabase({
          logger: log,
          indexedDB: params.options?.indexedDB,
          keyRange: params.options?.keyRange
        }),
        logger: log,
        useReadWorker: this.allowWorkers()
      })
    }
    return loader
  }

  private static allowWorkers(): boolean {
    const enabled = getQueryParameter('sharedArrayBufferHeaders', '0') === '1'
    //const workersEnabled = getQueryParameter('workers', 'false') === 'true'
  // If both server and workers are enabled, check if we can use them
    if (enabled && !canUseWorkers()) {
      this.logger(
        'Workers are not enabled. As browsers have removed support for SharedArrayBuffer and Atomics in cross-origin contexts, you need to enable them in your server response headers or use a modern browser that supports them.'
      )
      return false
    }
    return enabled
  }

  static getLogger(providedLogger?: CustomLogger): CustomLogger | undefined {
    if (getQueryParameter('debug', 'false') === 'true') {
      return providedLogger || this.logger
    }
    return providedLogger
  }

  static logger: CustomLogger = (m?: string, ...optionalParams: unknown[]) => {
    console.log(`[debug] ${m?.trim()}`, ...optionalParams)
  }
}
