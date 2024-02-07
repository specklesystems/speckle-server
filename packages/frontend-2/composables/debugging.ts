/* eslint-disable @typescript-eslint/no-explicit-any */
import { profileSync } from '@speckle/shared'

type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any
  ? R
  : never

export const computedProfiled = <V = unknown>(
  fn: () => V,
  ...options: ParametersExceptFirst<typeof profileSync>
) => {
  return computed(() => profileSync(fn, ...options))
}
