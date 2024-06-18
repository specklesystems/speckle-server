import { defineEventHandler, fromNodeMiddleware } from 'h3'
import type { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http'
import pino from 'pino'
import type { SerializedResponse } from 'pino'
import { pinoHttp } from 'pino-http'
import type { GenReqId } from 'pino-http'
import { randomUUID } from 'crypto'
import { REQUEST_ID_HEADER } from '~~/server/lib/core/helpers/constants'
import { get } from 'lodash-es'
import {
  serializeRequest,
  getRequestPath
} from '~/server/lib/core/helpers/observability'

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

const logger = useLogger()

export const LoggingMiddleware = pinoHttp({
  logger,
  autoLogging: true,
  genReqId: generateReqId,
  // this is here, to force logging 500 responses as errors in the final log
  // and we don't really care about 3xx stuff
  // all the user related 4xx responses are treated as info
  customLogLevel: (
    req: IncomingMessage,
    res: ServerResponse,
    error: Error | undefined
  ) => {
    // Mark some lower importance/spammy endpoints w/ 'debug' to reduce noise
    const path = getRequestPath(req)
    const shouldBeDebug =
      ['/metrics', '/health', '/api/status'].includes(path || '') ?? false

    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || error) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }

    return shouldBeDebug ? 'debug' : 'info'
  },
  customSuccessMessage() {
    return '{requestPath} request {requestStatus} in {responseTime} ms'
  },

  customSuccessObject(req, res, val: Record<string, unknown>) {
    const isCompleted = !req.readableAborted && res.writableEnded
    const requestStatus = isCompleted ? 'completed' : 'aborted'
    const requestPath = getRequestPath(req) || 'unknown'
    const appBindings = res.vueLoggerBindings || {}

    return {
      ...val,
      requestStatus,
      requestPath,
      ...appBindings
    }
  },

  customErrorMessage() {
    return '{requestPath} request {requestStatus} in {responseTime} ms'
  },
  customErrorObject(req, res, err, val: Record<string, unknown>) {
    const requestStatus = 'failed'
    const requestPath = getRequestPath(req) || 'unknown'
    const appBindings = res.vueLoggerBindings || {}

    return {
      ...val,
      requestStatus,
      requestPath,
      ...appBindings
    }
  },

  // we need to redact any potential sensitive data from being logged.
  // as we do not know what headers may be sent in a request by a user or client
  // we have to allow list selected headers
  serializers: {
    req: pino.stdSerializers.wrapRequestSerializer((req) => serializeRequest(req.raw)),
    res: pino.stdSerializers.wrapResponseSerializer((res) => {
      const resRaw = res as SerializedResponse & {
        raw: {
          headers: Record<string, string>
        }
      }
      const realRaw = get(res, 'raw.raw') as typeof res.raw
      const isRequestCompleted = !!realRaw.writableEnded
      const isRequestAborted = !isRequestCompleted
      const statusCode = res.statusCode || res.raw.statusCode || realRaw.statusCode

      return {
        statusCode,
        // Allowlist useful headers
        headers: resRaw.headers,
        isRequestAborted
      }
    })
  }
})

export default defineEventHandler(fromNodeMiddleware(LoggingMiddleware))
