/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as Observability from '@speckle/shared/dist/esm/observability/index.js'
import type { IncomingMessage } from 'node:http'
import { get } from 'lodash-es'
import type { Logger } from 'pino'
import type express from 'express'

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
