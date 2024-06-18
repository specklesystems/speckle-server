/* eslint-disable @typescript-eslint/no-explicit-any */
import { type MaybeAsync, buildManualPromise } from '@speckle/shared'
import { computedAsync } from '@vueuse/core'
import type { AsyncComputedOptions } from '@vueuse/core'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

export interface AsyncWritableComputedOptions<T> {
  get: (...args: any[]) => MaybeAsync<T>
  set: (value: T) => MaybeAsync<void>
  initialState: T
  readOptions?: AsyncComputedOptions
  asyncRead?: boolean
  debugging?: Partial<{
    log: {
      name: string
      writesOnly?: boolean
      readsOnly?: boolean
      logger?: (msg: string, ...args: any[]) => void
    }
  }>
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
  const { get, initialState, readOptions, set, asyncRead = true, debugging } = params
  const logSettings = debugging?.log
  const getTrace = () => (new Error('Trace:').stack || '').substring(7)
  const logger = params.debugging?.log?.logger || console.debug

  const finalGet: typeof get =
    logSettings && !logSettings.writesOnly
      ? () => {
          const res = get()
          logger(`debugging: '${logSettings.name}' read`, res, getTrace())
          return res
        }
      : get

  const finalSet: typeof set =
    logSettings && !logSettings.readsOnly
      ? (newVal) => {
          logger(`debugging: '${logSettings.name}' written to`, newVal, getTrace())
          return set(newVal)
        }
      : set

  const readValue = asyncRead
    ? computedAsync(finalGet, initialState, readOptions)
    : computed(finalGet)

  const getter = computed(() => readValue.value) as AsyncWritableComputedRef<T>
  getter.update = finalSet

  return getter
}

export { buildManualPromise }
