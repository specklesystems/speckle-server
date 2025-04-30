/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import Queue from '../helpers/queue.js'
import { Base, CustomLogger, Fetcher, Item } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'

export interface ObjectLoader2Options {
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  logger?: CustomLogger
  headers?: Headers
  results?: AsyncGeneratorQueue<Item>
  cache?: Cache
  downloader?: Downloader
}
export interface BaseDatabaseOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
  maxCacheReadSize: number
  maxCacheWriteSize: number
  maxCacheBatchWriteWait: number
  maxWriteQueueSize: number
}

export interface BaseDownloadOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers

  fetch?: Fetcher
  database: Cache
  results: Queue<Item>
}

export interface MemoryDatabaseOptions {
  logger?: CustomLogger
  items?: Record<string, Base>
}
