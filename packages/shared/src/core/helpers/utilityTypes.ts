import { isUndefined } from '#lodash'

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

type NullableKeys<T> = {
  [K in keyof T]: T[K] extends NonNullable<T[K]> ? never : K
}[keyof T]

/**
 * Converts all keys that can contain nullable values to be optional
 */
export type NullableKeysToOptional<T> = Omit<T, NullableKeys<T>> &
  Partial<Pick<T, NullableKeys<T>>>

/**
 * Removes null as a possibility from all of the property types
 */
export type NonNullableProperties<T> = {
  [K in keyof T]: NonNullable<T[K]>
}

/**
 * Create a type that makes all object values nullable
 */
export type SetValuesNullable<T> = {
  [P in keyof T]: T[P] | null
}
