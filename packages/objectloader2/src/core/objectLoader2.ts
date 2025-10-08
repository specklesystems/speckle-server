import { Deferment } from '../deferment/defermentManager.js'
import AggregateQueue from '../queues/aggregateQueue.js'
import AsyncGeneratorQueue from '../queues/asyncGeneratorQueue.js'
import { CustomLogger, take } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { Database, Downloader } from './interfaces.js'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'
import { ObjectLoader2Options, CacheOptions } from './options.js'
import { CacheReader } from './stages/cacheReader.js'
import { CacheWriter } from './stages/cacheWriter.js'

const MAX_CLOSURES_TO_TAKE = 100
const EXPECTED_CLOSURE_VALUE = 100

export class ObjectLoader2 {
  #rootId: string

  #logger: CustomLogger

  #database: Database
  #downloader: Downloader
  #cacheReader: CacheReader
  #cacheWriter: CacheWriter

  #deferments: Deferment

  #gathered: AsyncGeneratorQueue<Item>

  #root?: Item = undefined
  #isRootStored = false

  constructor(options: ObjectLoader2Options) {
    this.#rootId = options.rootId
    this.#logger = options.logger || ((): void => {})
    this.#logger('ObjectLoader2 initialized with rootId:', this.#rootId)

    const cacheOptions: CacheOptions = {
      logger: this.#logger,
      maxCacheReadSize: 10_000,
      maxCacheWriteSize: 10_000,
      maxWriteQueueSize: 40_000,
      maxCacheBatchWriteWait: 100, //100 ms, next to nothing!
      maxCacheBatchReadWait: 100 //100 ms, next to nothing!
    }

    this.#gathered = new AsyncGeneratorQueue()

    this.#database = options.database
    this.#deferments = options.deferments
    this.#downloader = options.downloader
    this.#cacheReader = new CacheReader(
      this.#database,
      this.#deferments,
      this.#logger,
      cacheOptions
    )
    this.#cacheReader.initializeQueue(this.#gathered, this.#downloader)
    this.#cacheWriter = new CacheWriter(
      this.#database,
      this.#logger,
      this.#deferments,
      cacheOptions,
      (id: string) => {
        this.#cacheReader.requestItem(id)
      }
    )
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([
      this.#gathered.disposeAsync(),
      this.#downloader.disposeAsync(),
      this.#cacheWriter.disposeAsync(),
      this.#cacheReader.disposeAsync()
    ])
    this.#deferments.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    if (!this.#root) {
      this.#root = (await this.#database.getAll([this.#rootId]))[0]
      if (!this.#root) {
        this.#root = await this.#downloader.downloadSingle()
      } else {
        this.#isRootStored = true
      }
    }
    return this.#root
  }

  async getObject(params: { id: string }): Promise<Base> {
    return await this.#cacheReader.getObject({ id: params.id })
  }

  async getTotalObjectCount(): Promise<number> {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base?.__closure || {}).length
    return totalChildrenCount + 1 //count the root
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const rootItem = await this.getRootObject()
    if (rootItem?.base === undefined) {
      this.#logger('No root object found!')
      return
    }
    if (!rootItem.base.__closure) {
      yield rootItem.base
      return
    }

    //sort the closures by their values descending
    const sortedClosures = Object.entries(rootItem.base.__closure ?? []).sort(
      (a, b) => b[1] - a[1]
    )
    this.#logger(
      'calculated closures: ',
      !take(sortedClosures.values(), MAX_CLOSURES_TO_TAKE).every(
        (x) => x[1] === EXPECTED_CLOSURE_VALUE
      )
    )
    const children = sortedClosures.map((x) => x[0])
    const total = children.length + 1 // +1 for the root object
    this.#downloader.initialize({
      results: new AggregateQueue(this.#gathered, this.#cacheWriter),
      total
    })
    //only for root
    this.#gathered.add(rootItem)
    this.#cacheReader.requestAll(children)
    let count = 0
    for await (const item of this.#gathered.consume()) {
      yield item.base! //always defined, as we add it to the queue
      count++
      if (count >= total) {
        break
      }
    }
    if (!this.#isRootStored) {
      await this.#database.putAll([rootItem])
      this.#isRootStored = true
    }
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    return ObjectLoader2Factory.createFromObjects(objects)
  }

  static createFromJSON(json: string): ObjectLoader2 {
    return ObjectLoader2Factory.createFromJSON(json)
  }
}
