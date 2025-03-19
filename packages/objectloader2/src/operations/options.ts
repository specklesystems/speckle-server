import { CustomLogger, Fetcher } from '../types/types.js'
import { ICache, IDownloader } from './interfaces.js'

export interface ObjectLoader2Options {
  customLogger: CustomLogger
  cache: ICache
  downloader: IDownloader
}
export interface BaseDatabaseOptions {
  indexedDB: IDBFactory
  enableCaching: boolean
  batchMaxSize: number
  batchMaxWait: number
}

export interface BaseDownloadOptions {
  fetch: Fetcher
  batchMaxSize: number
  batchMaxWait: number
}
