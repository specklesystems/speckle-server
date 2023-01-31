// NOTE TO FABS: I added this file as i'm using this func below quite a lot (containsAll)
// not sure it's the right place :)

/**
 * Checks for inclusion of one array (target) into another (source)
 * @param target the array you want to check that is included in the other one
 * @param source the array you want to check INTO for inclusion of the previous one
 */
export const containsAll = (target: unknown[], source: unknown[]) =>
  target.every((v) => source.includes(v))
