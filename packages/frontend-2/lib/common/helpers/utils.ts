import { intersection } from 'lodash-es'
export { isNonNullable } from '@speckle/shared'

/**
 * Checks for inclusion of one array (target) into another (source)
 * @param target the array you want to check that is included in the other one
 * @param source the array you want to check INTO for inclusion of the previous one
 */
export const containsAll = <T>(target: T[], source: T[]) =>
  target.every((v) => source.includes(v))

/**
 * Whether or not arrays are equal with the order being ignored
 */
export const arraysEqual = (arr1: unknown[], arr2: unknown[]) => {
  if (arr1.length !== arr2.length) return false
  return intersection(arr1, arr2).length === arr1.length
}

const isSet = <V = unknown>(vals: V[] | Set<V>): vals is Set<V> => vals instanceof Set
const toSet = <V = unknown>(vals: V[] | Set<V>): Set<V> =>
  isSet(vals) ? vals : new Set(vals)
const length = (vals: unknown[] | Set<unknown>) =>
  isSet(vals) ? vals.size : vals.length

/**
 * Various performance-improved array utilities:
 */

/**
 * Whenever you have to compare two arrays/sets, this function will make sure the biggest one is a Set for quick look ups
 * and so you can iterate over the smallest one
 * @param vals1
 * @param vals2
 */
const toOptimizedComparisonArrays = <V = unknown>(
  vals1: V[] | Set<V>,
  vals2: V[] | Set<V>
) => {
  const biggest: Set<V> = length(vals1) > length(vals2) ? toSet(vals1) : toSet(vals2)
  const smallest: V[] | Set<V> = length(vals1) > length(vals2) ? vals2 : vals1

  return { biggest, smallest: isSet(smallest) ? [...smallest] : smallest }
}

/**
 * A fast way to check if two arrays/sets have at least one element in common
 */
export const hasIntersection = <V = unknown>(
  vals1: V[] | Set<V>,
  vals2: V[] | Set<V>
) => {
  const { biggest, smallest } = toOptimizedComparisonArrays(vals1, vals2)
  if (!length(biggest) || !length(smallest)) return false

  return smallest.some((v) => biggest.has(v))
}
