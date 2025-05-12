/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Pump } from '../helpers/cachePump.js'
import { Base, CustomLogger, Fetcher } from '../types/types.js'
import { Downloader, Database } from './interfaces.js'

export interface ObjectLoader2Options {
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  logger?: CustomLogger
  headers?: Headers
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
  pump: Pump
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
