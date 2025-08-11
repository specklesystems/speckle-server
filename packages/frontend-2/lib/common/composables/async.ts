import { writableAsyncComputed as originalWritableAsyncComputed } from '@speckle/ui-components'
import type {
  AsyncWritableComputedOptions,
  AsyncWritableComputedRef
} from '@speckle/ui-components'

export type { AsyncWritableComputedOptions, AsyncWritableComputedRef }

/**
 * Allows async read/write from/to computed. Use `res.value` to read and `res.update` to write. If you only need
 * the computed to be read-only then use vueuse's `computedAsync`. If you only need async writes you can
 * disable async reads through the `asyncRead` param.
 * @param params
 */
export const writableAsyncComputed: typeof originalWritableAsyncComputed = (params) => {
  const logger = useLogger()
  return originalWritableAsyncComputed({
    ...params,
    debugging: params.debugging?.log
      ? {
          ...params.debugging,
          log: {
            ...params.debugging.log,
            logger: logger.debug
          }
        }
      : undefined
  })
}

/**
 * Like normal watch() except handles async callbacks in an ordered manner - previous
 * watches must complete, before new ones can get processed
 */
export const watchAsync = ((...args: Parameters<typeof watch>) => {
  const [source, cb, options] = args
  const logger = useLogger()

  const watches = shallowRef<Array<Promise<unknown>>>([])

  const watchRet = watch(
    source,
    (newVal, oldVal, onCleanup) => {
      // 1. Wait for all active processing to finish
      // 2. Then run new processing
      // 3. At the end - clean up watches array
      const handlerPromise = Promise.allSettled(watches.value).finally(() =>
        Promise.resolve(cb(newVal, oldVal, onCleanup))
          .catch((e) => {
            logger.error(e, 'Error occurred in watchAsync callback')
            throw e
          })
          .finally(() => {
            watches.value = watches.value.filter((p) => p !== handlerPromise)
          })
      )

      // Add handler to array
      watches.value = [...watches.value, handlerPromise]
    },
    options
  )

  return watchRet
}) as unknown as typeof watch // ts typing difficulty
