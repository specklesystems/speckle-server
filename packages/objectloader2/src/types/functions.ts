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

/**
 * Finds the first index of a "needle" Uint8Array within a "haystack" Uint8Array.
 * @param haystack The larger array to search within.
 * @param needle The smaller array to search for.
 * @param start The index to start searching from. Defaults to 0.
 * @returns The starting index of the needle, or -1 if not found.
 */
export function indexOf(
  haystack: Uint8Array,
  needle: Uint8Array,
  start: number = 0
): number {
  if (needle.length === 0) {
    return 0
  }

  // The last possible starting position for a match
  const limit = haystack.length - needle.length

  for (let i = start; i <= limit; i++) {
    let foundMatch = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        foundMatch = false
        break // Mismatch, break inner loop
      }
    }
    if (foundMatch) {
      return i // Found a full match at index i
    }
  }

  return -1 // No match found
}
