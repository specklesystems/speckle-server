import Queue from '../helpers/queue.js'
import { CustomLogger, Fetcher, Item } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'

export interface ObjectLoader2Options {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  logger?: CustomLogger
  cache?: Cache
  downloader?: Downloader
}
export interface BaseDatabaseOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  enableCaching?: boolean
  maxCacheReadSize?: number
  maxCacheWriteSize?: number
  maxCacheBatchWriteWait?: number
}

export interface BaseDownloadOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string

  fetch?: Fetcher
  database: Cache
  results: Queue<Item>
}
