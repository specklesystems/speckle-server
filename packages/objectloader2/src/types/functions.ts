import { Base, Reference } from './types.js'

export type CustomLogger = (message?: string, ...optionalParams: unknown[]) => void

export type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

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

export enum ObjectLoader2Flags {
  DEBUG = 'debug',
  USE_CACHE = 'useCache'
}

const defaultValues: Record<ObjectLoader2Flags, string> = {
  [ObjectLoader2Flags.DEBUG]: 'false',
  [ObjectLoader2Flags.USE_CACHE]: 'true'
}

export function getFeatureFlag(paramName: ObjectLoader2Flags): string {
  // Check if the code is running in a browser environment 🌐
  const isBrowser =
    typeof window !== 'undefined' && typeof window.document !== 'undefined'

  if (!isBrowser) {
    // If in Node.js or another server environment, return the default
    return defaultValues[paramName]
  }

  // In a browser, parse the query string
  const params = new URLSearchParams(window.location.search)

  // .get() returns the value, or null if it's not found.
  // The nullish coalescing operator (??) provides the default value
  // if the left-hand side is null or undefined.
  return params.get(paramName) ?? defaultValues[paramName]
}
