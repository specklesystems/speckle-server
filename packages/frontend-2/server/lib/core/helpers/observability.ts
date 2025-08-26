import * as Observability from '@speckle/shared/observability'
import type { IncomingMessage } from 'node:http'
import { get } from 'lodash-es'
import type { Logger } from 'pino'
import type express from 'express'
import { prettifiedLoggerFactory, prettify } from '~/lib/core/helpers/observability'
import type { ConsolaInstance, LogType } from 'consola'

const redactedReqHeaders = ['authorization', 'cookie']

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
          const log = logMethod.bind(target)

          // Re-setting bindings on every log call, cause there's no other way to make them dynamic
          try {
            const boundVals = bindings()
            target.setBindings(boundVals)
          } catch (e) {
            target.error(e, 'Failed to set dynamic bindings')
          }

          return log(...args)
        }
      }

      return get(target, prop)
    }
  })
}

export function serializeRequest(req: IncomingMessage) {
  return {
    id: req.id,
    method: req.method,
    path: getRequestPath(req),
    // Allowlist useful headers
    headers: Object.keys(req.headers).reduce((obj, key) => {
      let valueToPrint = req.headers[key]
      if (redactedReqHeaders.includes(key.toLocaleLowerCase())) {
        valueToPrint = `REDACTED[length: ${valueToPrint ? valueToPrint.length : 0}]`
      }
      return {
        ...obj,
        [key]: valueToPrint
      }
    }, {})
  }
}

export const getRequestPath = (req: IncomingMessage | express.Request) => {
  const path = ((get(req, 'originalUrl') || get(req, 'url') || '') as string).split(
    '?'
  )[0] as string
  return path?.length ? path : null
}

// i dunno why but importing this returns undefined in server build, it makes no sense to me why it would be stripped out
// but the solution is to duplicate this here
const consolaLogLevels = {
  silent: Number.NEGATIVE_INFINITY,
  fatal: 0,
  error: 0,
  warn: 1,
  log: 2,
  info: 3,
  success: 3,
  fail: 3,
  ready: 3,
  start: 3,
  box: 3,
  debug: 4,
  trace: 5,
  verbose: Number.POSITIVE_INFINITY
}

interface DevLogsServerContext {
  consola?: ConsolaInstance
}

export const initSsrDevLogs = async (params: { logLevel: LogType }) => {
  const { getContext } = await import('unctx')
  const { AsyncLocalStorage } = await import('node:async_hooks')

  const asyncContext = getContext<DevLogsServerContext>('nuxt-dev-logs', {
    asyncContext: true,
    AsyncLocalStorage
  })

  const ctx = asyncContext.tryUse()
  if (ctx?.consola) {
    // Fix up
    // remove print to stdout, pino already handles all that
    ctx.consola.setReporters(
      ctx.consola.options.reporters.filter(
        (r) => get(r, 'constructor.name') !== 'FancyReporter'
      )
    )
    ctx.consola.level = consolaLogLevels[params.logLevel] || 0
  }

  return {
    consola: ctx?.consola
  }
}

export { prettifiedLoggerFactory, prettify }
