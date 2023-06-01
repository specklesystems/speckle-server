/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync } from '@speckle/shared'
import { AsyncComputedOptions, computedAsync } from '@vueuse/core'

export interface AsyncWritableComputedOptions<T> {
  get: (...args: any[]) => MaybeAsync<T>
  set: (value: T) => MaybeAsync<void>
  initialState: T
  readOptions?: AsyncComputedOptions
}

export type AsyncWritableComputedRef<T> = ComputedRef<T> & {
  update: AsyncWritableComputedOptions<T>['set']
}

/**
 * Allows async read/write from/to computed. Use `res.value` to read and `res.update` to write. If you only need
 * the computed to be read-only then use vueuse's `computedAsync`.
 * @param params
 */
export function writableAsyncComputed<T>(
  params: AsyncWritableComputedOptions<T>
): AsyncWritableComputedRef<T> {
  const readValue = computedAsync(params.get, params.initialState, params.readOptions)

  const getter = computed(() => readValue.value) as AsyncWritableComputedRef<T>
  getter.update = params.set

  return getter
}
