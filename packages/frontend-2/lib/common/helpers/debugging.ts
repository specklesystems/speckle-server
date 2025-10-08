import { CleanStackTrace, collectLongTrace } from '@speckle/shared'
import { isString } from 'lodash-es'

type LoggingRefOptions<R extends Ref<unknown>> = Partial<{
  writes: boolean
  reads: boolean
  name: string
  transform: (val: R['value']) => unknown
  enabled: boolean
}>
type LoggingRefNameOrOptions<R extends Ref<unknown>> = string | LoggingRefOptions<R>

const parseNameOrOptions = <R extends Ref<unknown>>(
  nameOrOptions: LoggingRefNameOrOptions<R> | undefined
): Required<LoggingRefOptions<R>> => {
  const options: LoggingRefOptions<R> = nameOrOptions
    ? isString(nameOrOptions)
      ? { name: nameOrOptions }
      : nameOrOptions
    : {}
  const name = options.name || 'unknown ref'
  const transform = options.transform || ((val) => val)
  const enabled = options.enabled ?? true
  const writes = options.writes ?? true
  const reads = options.reads ?? false // usually interested in just writes

  return { name, transform, enabled, writes, reads }
}

/**
 * Wrap refs with writable computeds that output where reads/writes are coming from
 */
export function makeRefLogged<R extends Ref<unknown>>(
  ref: R,
  nameOrOptions?: LoggingRefNameOrOptions<R> | undefined
): R {
  const { writes, reads, name, transform, enabled } = parseNameOrOptions(nameOrOptions)
  const getTrace = collectLongTrace
  const { logger } = useSafeLogger()

  return computed({
    get: () => {
      if (reads && enabled) {
        logger().debug(`debugging: '${name}' read`, {
          val: transform(ref.value),
          trace: getTrace()
        })
      }

      return ref.value
    },
    set: (newVal) => {
      if (writes && enabled) {
        logger().debug(`debugging: '${name}' written to`, {
          val: transform(newVal),
          trace: getTrace()
        })
      }

      ref.value = newVal
    }
    // hiding the real type so that you don't have to re-type everything that relies on the ref being a ref
  }) as unknown as R
}

/**
 * Define a trackable ref that logs reads and writes to the console w/ stack traces. Useful for figuring out
 * what's causing a ref to change.
 */
export const refLogged = <T>(
  nameOrOptions: LoggingRefNameOrOptions<Ref<T>>,
  value: T
) => {
  return makeRefLogged<Ref<T>>(ref<T>(value) as Ref<T>, nameOrOptions)
}

export const refWithLogging = refLogged

export function getCurrentTrace() {
  return (new Error('Trace:').stack || '').substring(7)
}

export { CleanStackTrace as StackTrace, CleanStackTrace }
