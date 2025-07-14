import { CustomLogger } from '../types/functions.js'
import { Base } from '../types/types.js'
import { Downloader, Database } from './interfaces.js'

export interface ObjectLoader2Options {
  rootId: string
  downloader: Downloader
  database: Database
  logger?: CustomLogger
  useReadWorker?: boolean
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
