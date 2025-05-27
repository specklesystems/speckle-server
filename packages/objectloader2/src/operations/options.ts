import { Base, CustomLogger } from '../types/types.js'
import { Downloader, Database } from './interfaces.js'

export interface ObjectLoader2Options {
  rootId: string
  downloader: Downloader
  database: Database
  logger?: CustomLogger
}

export interface CacheOptions {
  logger?: CustomLogger
  maxCacheReadSize: number
  maxCacheWriteSize: number
  maxCacheBatchWriteWait: number
  maxCacheBatchReadWait: number
  maxWriteQueueSize: number
}

export interface MemoryDatabaseOptions {
  logger?: CustomLogger
  items?: Map<string, Base>
}

export interface DefermentManagerOptions {
  logger?: CustomLogger
  maxSizeInMb: number
  ttlms: number
}
