export enum ObjectLoader2Flags {
  DEBUG = 'debug',
  USE_CACHE = 'useCache'
}

const defaultValues: Record<ObjectLoader2Flags, boolean> = {
  [ObjectLoader2Flags.DEBUG]: false,
  [ObjectLoader2Flags.USE_CACHE]: true
}

// Check if the code is running in a browser environment 🌐
const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'

// In a browser, parse the query string
const params = new URLSearchParams(window.location.search)

function parseBoolean(value: string | null | undefined): boolean | undefined {
  // Return false for null, undefined, or empty strings.
  if (!value) {
    return undefined
  }

  // Normalize the string and check it.
  return value.trim().toLowerCase() === 'true'
}

export function flagIsEnabledFromQuery(paramName: ObjectLoader2Flags): boolean {
  if (!isBrowser) {
    if (paramName === ObjectLoader2Flags.USE_CACHE) {
      return false // Disable caching by default in non-browser environments
    }
    // If in Node.js or another server environment, return the default
    return defaultValues[paramName]
  }

  // .get() returns the value, or null if it's not found.
  // The nullish coalescing operator (??) provides the default value
  // if the left-hand side is null or undefined.
  return parseBoolean(params.get(paramName)) ?? defaultValues[paramName]
}
