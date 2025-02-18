/* eslint-disable @typescript-eslint/no-explicit-any */
type Factory<Deps extends object = any, Args = any, ReturnType = any> = (
  deps: Deps
) => (...args: Args[]) => ReturnType

export type DependenciesOf<F extends Factory> = F extends Factory<infer Deps>
  ? Deps
  : never
