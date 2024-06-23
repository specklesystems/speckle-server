/**
 * Flattens a speckle object. It will ignore arrays, null and undefined valuesm, as well as various 'safe to ignore' speckle properties, such as
 * bbox, __closure, __parents, totalChildrenCount.
 * @param obj object to flatten
 * @returns an object with all its props flattened into `prop.subprop.subsubprop`.
 */
const flattenObject = function (obj: { [x: string]: unknown; id: unknown }) {
  const flatten = {} as Record<string, unknown>
  for (const k in obj) {
    if (
      k === 'id' ||
      k === '__closure' ||
      k === '__parents' ||
      k === 'bbox' ||
      k === 'totalChildrenCount'
    )
      continue

    const v = obj[k]
    if (v === null || v === undefined || Array.isArray(v)) continue
    if (v.constructor === Object) {
      const flattenProp = flattenObject(v as { [x: string]: unknown; id: unknown })
      for (const pk in flattenProp) {
        flatten[k + '.' + pk] = flattenProp[pk]
      }
      continue
    }
    const type = typeof v
    if (type === 'string' || type === 'number' || type === 'boolean') flatten[k] = v
  }
  if (obj.id) flatten.id = obj.id
  return flatten
}

export default flattenObject
