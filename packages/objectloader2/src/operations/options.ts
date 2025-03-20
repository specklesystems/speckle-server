import { CustomLogger, Fetcher } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'

export interface ObjectLoader2Options {
  logger: CustomLogger
  cache: Cache
  downloader: Downloader
}
export interface BaseDatabaseOptions {
  logger: CustomLogger
  indexedDB: IDBFactory
  enableCaching: boolean
  maxCacheReadSize: number
  maxCacheWriteSize: number
  maxCacheBatchWriteWait: number
}

export interface BaseDownloadOptions {
  fetch: Fetcher
  maxDownloadSize: number
  maxDownloadBatchWait: number
}
