import { Observability } from '@speckle/shared'
import { defineEventHandler, fromNodeMiddleware } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import pino from 'pino'
import type { SerializedResponse } from 'pino'
import { pinoHttp } from 'pino-http'
import type { GenReqId } from 'pino-http'
import { randomUUID } from 'crypto'
import type { IncomingHttpHeaders } from 'http'
import { REQUEST_ID_HEADER } from '~~/server/lib/core/helpers/constants'
import { get } from 'lodash'

/**
 * Server request logger
 */

function determineRequestId(
  headers: IncomingHttpHeaders,
  uuidGenerator: () => string = randomUUID
): string {
  const idHeader = headers[REQUEST_ID_HEADER]
  if (!idHeader) return uuidGenerator()
  if (Array.isArray(idHeader)) return idHeader[0] ?? uuidGenerator()
  return idHeader
}

const generateReqId: GenReqId = (req: IncomingMessage) =>
  determineRequestId(req.headers)

const logger = Observability.getLogger(
  useRuntimeConfig().public.logLevel,
  useRuntimeConfig().public.logPretty
)

const redactedHeaders = ['authorization', 'cookie']

export const LoggingMiddleware = pinoHttp({
  logger,
  autoLogging: true,
  genReqId: generateReqId,
  // this is here, to force logging 500 responses as errors in the final log
  // and we don't really care about 3xx stuff
  // all the user related 4xx responses are treated as info
  customLogLevel: (
    _: IncomingMessage,
    res: ServerResponse,
    error: Error | undefined
  ) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || error) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }
    return 'info'
  },

  customSuccessMessage(req, res, responseTime) {
    const path = req.url?.split('?')[0] ?? 'unknown'
    const isCompleted = !req.readableAborted && res.writableEnded
    const statusMessage = isCompleted ? 'request completed' : 'request aborted'

    return `[${path}] ${statusMessage} in ${responseTime}ms`
  },

  customErrorMessage(req) {
    const path = req.url?.split('?')[0] ?? 'unknown'
    return `[${path}] request errored`
  },

  // we need to redact any potential sensitive data from being logged.
  // as we do not know what headers may be sent in a request by a user or client
  // we have to allow list selected headers
  serializers: {
    req: pino.stdSerializers.wrapRequestSerializer((req) => {
      return {
        id: req.raw.id,
        method: req.raw.method,
        path: req.raw.url?.split('?')[0], // Remove query params which might be sensitive
        // Allowlist useful headers
        headers: Object.keys(req.raw.headers).reduce((obj, key) => {
          let valueToPrint = req.raw.headers[key]
          if (redactedHeaders.includes(key.toLocaleLowerCase())) {
            valueToPrint = `REDACTED[length: ${valueToPrint ? valueToPrint.length : 0}]`
          }
          return {
            ...obj,
            [key]: valueToPrint
          }
        }, {})
      }
    }),
    res: pino.stdSerializers.wrapResponseSerializer((res) => {
      const resRaw = res as SerializedResponse & {
        raw: {
          headers: Record<string, string>
        }
      }
      const realRaw = get(res, 'raw.raw') as typeof res.raw
      const isRequestCompleted = !!realRaw.writableEnded
      const isRequestAborted = !isRequestCompleted

      return {
        statusCode: res.raw.statusCode,
        // Allowlist useful headers
        headers: resRaw.headers,
        isRequestAborted
      }
    })
  }
})

export default defineEventHandler(fromNodeMiddleware(LoggingMiddleware))
