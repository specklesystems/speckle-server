import { Base, CustomLogger } from '../types/types.js'
import IndexedDatabase from './databases/indexedDatabase.js'
import { MemoryDatabase } from './databases/memoryDatabase.js'
import { MemoryDownloader } from './downloaders/memoryDownloader.js'
import ServerDownloader from './downloaders/serverDownloader.js'
import { ObjectLoader2 } from './objectLoader2.js'

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
    indexedDB?: IDBFactory
    logger?: CustomLogger
  }): ObjectLoader2 {
    const loader = new ObjectLoader2({
      rootId: params.objectId,
      downloader: new ServerDownloader({
        serverUrl: params.serverUrl,
        streamId: params.streamId,
        objectId: params.objectId,
        token: params.token,
        headers: params.headers
      }),
      database: new IndexedDatabase({
        logger: params.logger,
        indexedDB: params.indexedDB,
        keyRange: params.keyRange
      })
    })
    return loader
  }
}
