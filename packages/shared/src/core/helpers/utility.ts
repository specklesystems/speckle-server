import { isNull, isUndefined } from 'lodash'

export const isNullOrUndefined = (val: unknown): val is null | undefined =>
  isNull(val) || isUndefined(val)

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
