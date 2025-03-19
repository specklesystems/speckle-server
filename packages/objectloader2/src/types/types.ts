export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export interface Item {
  baseId: string
  base: Base
}

export interface Base {
  id: string
  __closure?: Record<string, number>[]
}

export interface ObjectLoader2Options {
  customLogger?: CustomLogger
}
export interface BaseDatabaseOptions {
  enableCaching: boolean
  batchMaxSize: number
  batchMaxWait: number
}

export interface BaseDownloadOptions {
  batchMaxSize: number
  batchMaxWait: number
}

export function isBase(maybeBase?: unknown): maybeBase is Base {
  return (
    maybeBase !== null &&
    typeof maybeBase === 'object' &&
    'id' in maybeBase &&
    typeof maybeBase.id === 'string'
  )
}
