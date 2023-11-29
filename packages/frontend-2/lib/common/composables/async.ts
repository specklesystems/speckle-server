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
