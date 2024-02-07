/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Observability } from '@speckle/shared'
import { get } from 'lodash-es'
import type { Logger } from 'pino'

export function buildLogger(logLevel: string = 'info', logPretty: boolean = false) {
  return Observability.getLogger(logLevel, logPretty)
}

export function enableDynamicBindings(
  logger: Logger,
  bindings: () => Record<string, unknown>
): Logger {
  return new Proxy(logger, {
    get(target, prop) {
      if (
        ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(prop as string)
      ) {
        const logMethod = get(target, prop) as (...args: unknown[]) => void
        return (...args: unknown[]) => {
          // Re-setting bindings on every log call, cause there's no other way to make them dynamic
          const boundVals = bindings()
          target.setBindings(boundVals)

          logMethod.bind(target)(...args)
        }
      }

      return get(target, prop)
    }
  })
}
