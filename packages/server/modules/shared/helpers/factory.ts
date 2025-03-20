/* eslint-disable @typescript-eslint/no-explicit-any */
export type Factory<
  Deps extends object = any,
  Args extends Array<any> = any,
  ReturnType = any
> = (deps: Deps) => (...args: Args) => ReturnType

export type DependenciesOf<F extends Factory> = F extends Factory<infer Deps>
  ? Deps
  : never

export type FactoryResultOf<F extends Factory> = F extends Factory<
  any,
  infer Args,
  infer ReturnType
>
  ? (...args: Args) => ReturnType
  : never
