import { isNull, isUndefined } from 'lodash'

export const isNullOrUndefined = (val: unknown): val is null | undefined =>
  isNull(val) || isUndefined(val)

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Not nullable type guard, useful in `.filter()` calls for proper TS typed
 * results
 */
export const isNonNullable = <V>(v: V): v is NonNullable<typeof v> => !!v
