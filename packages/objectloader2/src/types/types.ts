export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

export interface Item {
  baseId: string
  base: Base
  size?: number
}

export interface Base {
  id: string
  speckle_type: string
  __closure?: Record<string, number>
}

export interface Reference {
  speckle_type: string
  referencedId: string
  __closure?: Record<string, number>
}

export interface DataChunk extends Base {
  data?: Base[]
}

export function isBase(maybeBase?: unknown): maybeBase is Base {
  return (
    maybeBase !== null &&
    typeof maybeBase === 'object' &&
    'id' in maybeBase &&
    typeof maybeBase.id === 'string'
  )
}

export function isReference(maybeRef?: unknown): maybeRef is Reference {
  return (
    maybeRef !== null &&
    typeof maybeRef === 'object' &&
    'referencedId' in maybeRef &&
    typeof maybeRef.referencedId === 'string'
  )
}

export function isScalar(
  value: unknown
): value is string | number | boolean | bigint | symbol | undefined {
  const type = typeof value
  return (
    value === null ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'bigint' ||
    type === 'symbol' ||
    type === 'undefined'
  )
}

export function take<T>(it: Iterator<T>, count: number): T[] {
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    const itr = it.next()
    if (itr.done) break
    result.push(itr.value)
  }
  return result
}
