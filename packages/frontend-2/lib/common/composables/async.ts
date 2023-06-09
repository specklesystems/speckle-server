/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync } from '@speckle/shared'
import { AsyncComputedOptions, computedAsync } from '@vueuse/core'

export interface AsyncWritableComputedOptions<T> {
  get: (...args: any[]) => MaybeAsync<T>
  set: (value: T) => MaybeAsync<void>
  initialState: T
  readOptions?: AsyncComputedOptions
  asyncRead?: boolean
}

export type AsyncWritableComputedRef<T> = ComputedRef<T> & {
  update: AsyncWritableComputedOptions<T>['set']
}

/**
 * Allows async read/write from/to computed. Use `res.value` to read and `res.update` to write. If you only need
 * the computed to be read-only then use vueuse's `computedAsync`. If you only need async writes you can
 * disable async reads through the `asyncRead` param.
 * @param params
 */
export function writableAsyncComputed<T>(
  params: AsyncWritableComputedOptions<T>
): AsyncWritableComputedRef<T> {
  const { get, initialState, readOptions, set, asyncRead = true } = params
  const readValue = asyncRead
    ? computedAsync(get, initialState, readOptions)
    : computed(get)

  const getter = computed(() => readValue.value) as AsyncWritableComputedRef<T>
  getter.update = set

  return getter
}
