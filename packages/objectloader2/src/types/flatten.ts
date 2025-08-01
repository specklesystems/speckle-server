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

export function sententizeBase(obj: Base): string {
  const flattened = flattenBase(obj)
  const propertyStrings = Object.entries(flattened).map(([key, value]) => {
    // Make the key more readable (e.g., "Fire Rating" instead of "FireRating")
    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
    return `${formattedKey} is ${value}`
  })
  // Join the individual strings with a comma and a space.
  return `This object has the following properties: ${propertyStrings.join(', ')}.`
}
