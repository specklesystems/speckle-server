import { intersection } from 'lodash-es'
export { isNonNullable } from '@speckle/shared'

/**
 * Checks for inclusion of one array (target) into another (source)
 * @param target the array you want to check that is included in the other one
 * @param source the array you want to check INTO for inclusion of the previous one
 */
export const containsAll = (target: unknown[], source: unknown[]) =>
  target.every((v) => source.includes(v))

/**
 * Whether or not arrays are equal with the order being ignored
 */
export const arraysEqual = (arr1: unknown[], arr2: unknown[]) => {
  if (arr1.length !== arr2.length) return false
  return intersection(arr1, arr2).length === arr1.length
}
