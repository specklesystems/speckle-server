import { ObjectLoaderRuntimeError } from './errors.js'

export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export interface Item {
  id: string
  obj: Base
}

export interface Base {
  id: string
  __closure?: Record<string, number>
}

export class ObjectLoader2Options {
  customLogger?: CustomLogger
}
export class BaseDatabaseOptions {
  enableCaching: boolean = true
}

export function isBase(maybeBase?: unknown): boolean {
  return (
    maybeBase !== null &&
    typeof maybeBase === 'object' &&
    'id' in maybeBase &&
    typeof maybeBase.id === 'string'
  )
}

export function asBase(maybeBase?: unknown): Base {
  if (!isBase(maybeBase)) {
    throw new ObjectLoaderRuntimeError('maybeBase is not a base')
  }
  return maybeBase as Base
}
