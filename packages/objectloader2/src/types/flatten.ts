import { Base } from './types.js'

/**
 * Flattens a speckle object. It will ignore arrays, null and undefined valuesm, as well as various 'safe to ignore' speckle properties, such as
 * bbox, __closure, __parents, totalChildrenCount.
 * @param obj object to flatten
 * @returns an object with all its props flattened into `prop.subprop.subsubprop`.
 */
export function flattenBase(obj: Base): Record<string, string | number> {
  const flatten = {} as Record<string, string | number>
  for (const k in obj) {
    if (
      k === 'id' ||
      k === '__closure' ||
      k === '__parents' ||
      k === 'bbox' ||
      k === 'totalChildrenCount'
    ) {
      continue
    }

    const v = obj[k]
    if (v === null || v === undefined || Array.isArray(v)) {
      continue
    }
    if (v.constructor === Object) {
      const flattenProp = flattenBase(v as unknown as Base)
      for (const pk in flattenProp) {
        flatten[k + '.' + pk] = flattenProp[pk]
      }
      continue
    }
    const type = typeof v
    if (type === 'string' || type === 'number') {
      flatten[k] = v as string | number
    } else if (type === 'boolean') {
      flatten[k] = v ? 'true' : 'false' // Convert boolean to string for consistency
    }
  }
  if (obj.id) {
    flatten.id = obj.id
  }
  return flatten
}

function formatSpecklePath(path: string): string {
  // Step 1: Replace all dots with spaces.
  let formattedString = path.replace(/\./g, ' ')

  // Step 2: Find words with only uppercase letters and underscores,
  // then format them into title case.
  const regex = /\b([A-Z_]+)\b/g

  formattedString = formattedString.replace(regex, (match) => {
    // Example match: "DATUM_TEXT"
    return match
      .toLowerCase() // -> "datum_text"
      .split('_') // -> ["datum", "text"]
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // -> ["Datum", "Text"]
      .join(' ') // -> "Datum Text"
  })

  return formattedString
}

export function sententizeBase(obj: Base): string {
  const flattened = flattenBase(obj)
  const propertyStrings = Object.entries(flattened).map(([key, value]) => {
    // Make the key more readable (e.g., "Fire Rating" instead of "FireRating")
  //  const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
    return `${key} is ${value}`
  })
  // Join the individual strings with a comma and a space.
  return `This object has the following properties: ${propertyStrings.join(', ')}.`
}
