import { isBoolean } from '#lodash'
import { isBrowser } from '../helpers/env.js'

export enum ObjectLoader2Flags {
  DEBUG = 'debug',
  USE_CACHE = 'useCache'
}

const defaultValues: Record<
  ObjectLoader2Flags,
  boolean | { browser: boolean; node: boolean }
> = {
  [ObjectLoader2Flags.DEBUG]: false,
  [ObjectLoader2Flags.USE_CACHE]: { browser: true, node: false }
}

function parseBoolean(value: string | null | undefined): boolean | undefined {
  // Return false for null, undefined, or empty strings.
  if (!value) {
    return undefined
  }

  // Normalize the string and check it.
  return value.trim().toLowerCase() === 'true'
}

export function flagIsEnabledFromQuery(paramName: ObjectLoader2Flags): boolean {
  // In a browser, parse the query string
  const params = new URLSearchParams(isBrowser ? window.location.search : '')

  let defaultValue = defaultValues[paramName]
  if (isBoolean(defaultValues[paramName])) {
    defaultValue = defaultValues[paramName]
  } else {
    defaultValue = isBrowser
      ? defaultValues[paramName].browser
      : defaultValues[paramName].node
  }

  // .get() returns the value, or null if it's not found.
  // The nullish coalescing operator (??) provides the default value
  // if the left-hand side is null or undefined.
  return parseBoolean(params.get(paramName)) ?? defaultValue
}
