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

export function isBase(maybeBase?: unknown): maybeBase is Base {
  return (
    maybeBase !== null &&
    typeof maybeBase === 'object' &&
    'id' in maybeBase &&
    typeof maybeBase.id === 'string'
  )
}
