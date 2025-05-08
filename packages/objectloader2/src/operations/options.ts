/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { CachePump } from '../helpers/cachePump.js'
import Queue from '../helpers/queue.js'
import { Base, CustomLogger, Fetcher, Item } from '../types/types.js'
import { Database } from './indexedDatabase.js'
import { Downloader } from './interfaces.js'

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
  downloader?: Downloader
  database?: Database
}
export interface BaseDatabaseOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
}

export interface CacheOptions {
  logger?: CustomLogger
  maxCacheReadSize: number
  maxCacheWriteSize: number
  maxCacheBatchWriteWait: number
  maxCacheBatchReadWait: number
  maxWriteQueueSize: number
}

export interface BaseDownloadOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers

  fetch?: Fetcher
  cache: CachePump
  results: Queue<Item>
}

export interface MemoryDatabaseOptions {
  logger?: CustomLogger
  items?: Map<string, Base>
}

export interface DefermentManagerOptions {
  logger?: CustomLogger
  maxSize: number
  ttl: number
}
