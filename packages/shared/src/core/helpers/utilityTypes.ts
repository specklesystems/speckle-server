import { isUndefined } from 'lodash'

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type MaybeNullOrUndefined<T> = T | null | undefined
export type MaybeAsync<T> = T | Promise<T>
export type MaybeFalsy<T> = T | null | undefined | false | '' | 0

/**
 * In TS undefined !== void, so use this type guard to check for both
 */
export const isUndefinedOrVoid = (val: unknown): val is void | undefined =>
  isUndefined(val)
