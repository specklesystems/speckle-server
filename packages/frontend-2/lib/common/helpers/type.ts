import { SetNonNullable, SetRequired } from 'type-fest'

/**
 * Marks keys not nullable and not undefined
 */
export type SetFullyRequired<BaseType, Keys extends keyof BaseType> = SetRequired<
  SetNonNullable<BaseType, Keys>,
  Keys
>
