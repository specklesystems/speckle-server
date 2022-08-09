/**
 * Flattens a speckle object. It will ignore arrays, null and undefined valuesm, as well as various 'safe to ignore' speckle properties, such as
 * bbox, __closure, __parents, totalChildrenCount.
 * @param obj object to flatten
 * @returns an object with all its props flattened into `prop.subprop.subsubprop`.
 */
const flattenObject = function (obj) {
  const flatten = {} as any
  for (const k in obj) {
    if (['id', '__closure', '__parents', 'bbox', 'totalChildrenCount'].includes(k))
      continue
    const v = obj[k]
    if (v === null || v === undefined || Array.isArray(v)) continue
    if (v.constructor === Object) {
      const flattenProp = flattenObject(v)
      for (const pk in flattenProp) {
        flatten[`${k}.${pk}`] = flattenProp[pk]
      }
      continue
    }
    if (['string', 'number', 'boolean'].includes(typeof v)) flatten[k] = v
  }
  if (obj.id) flatten.id = obj.id
  return flatten
}

export default flattenObject
