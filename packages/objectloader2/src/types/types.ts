export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

export interface Item {
  baseId: string
  base: Base
}

export interface Base {
  id: string
  __closure?: Record<string, number>
}

export function isBase(maybeBase?: unknown): maybeBase is Base {
  return (
    maybeBase !== null &&
    typeof maybeBase === 'object' &&
    'id' in maybeBase &&
    typeof maybeBase.id === 'string'
  )
}
