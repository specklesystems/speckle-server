/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObjectLike as lodashIsObjectLike } from 'lodash-es'
import type { SetNonNullable, SetRequired } from 'type-fest'

export type NonUndefined<T> = T extends undefined ? never : T

/**
 * Marks keys not nullable and not undefined
 */
export type SetFullyRequired<BaseType, Keys extends keyof BaseType> = SetRequired<
  SetNonNullable<BaseType, Keys>,
  Keys
>

export type AddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any]
> = (...args: [...Parameters<TFunction>, ...TParameters]) => ReturnType<TFunction>

export const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  lodashIsObjectLike(value)
