import { Observability } from '@speckle/shared'
import { defineEventHandler, fromNodeMiddleware } from 'h3'
import { IncomingMessage, ServerResponse } from 'http'
import pino, { SerializedResponse } from 'pino'
import { GenReqId, pinoHttp } from 'pino-http'
import { randomUUID } from 'crypto'
import { IncomingHttpHeaders } from 'http'
import { REQUEST_ID_HEADER } from '~~/server/lib/core/helpers/constants'

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
      return {
        statusCode: res.raw.statusCode,
        // Allowlist useful headers
        headers: resRaw.headers
      }
    })
  }
})

export default defineEventHandler(fromNodeMiddleware(LoggingMiddleware))
