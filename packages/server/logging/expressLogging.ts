import { logger } from '@/logging/logging'
import { randomUUID } from 'crypto'
import HttpLogger from 'pino-http'
import type { NextFunction, Response } from 'express'
import pino from 'pino'
import type { SerializedResponse } from 'pino'
import type { GenReqId } from 'pino-http'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Optional } from '@speckle/shared'
import { getRequestPath } from '@/modules/core/helpers/server'
import { get } from 'lodash'

const REQUEST_ID_HEADER = 'x-request-id'

const GenerateRequestId: GenReqId = (req: IncomingMessage) => DetermineRequestId(req)

const DetermineRequestId = (
  req: IncomingMessage,
  uuidGenerator: () => string = randomUUID
): string => {
  const headers = req.headers[REQUEST_ID_HEADER]
  if (!Array.isArray(headers)) return headers || uuidGenerator()
  return headers[0] || uuidGenerator()
}

export const sanitizeHeaders = (headers: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) =>
        ![
          'cookie',
          'authorization',
          'cf-connecting-ip',
          'true-client-ip',
          'x-real-ip',
          'x-forwarded-for',
          'x-original-forwarded-for'
        ].includes(key.toLocaleLowerCase())
    )
  )

export const LoggingExpressMiddleware = HttpLogger({
  logger,
  autoLogging: true,
  genReqId: GenerateRequestId,
  customLogLevel: (req, res, err) => {
    const path = getRequestPath(req)
    const shouldBeDebug =
      ['/metrics', '/readiness', '/liveness'].includes(path || '') ?? false

    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'info'
    }

    return shouldBeDebug ? 'debug' : 'info'
  },

  customReceivedMessage() {
    return '{requestPath} request received'
  },

  customReceivedObject(req, res, loggableObject: Record<string, unknown>) {
    const requestPath = getRequestPath(req) || 'unknown'
    const country = req.headers['cf-ipcountry'] as Optional<string>
    return {
      ...loggableObject,
      requestPath,
      country
    }
  },

  customSuccessMessage() {
    return '{requestPath} request {requestStatus} in {responseTime} ms'
  },

  customSuccessObject(req, res, val: Record<string, unknown>) {
    const isCompleted = !req.readableAborted && res.writableEnded
    const requestStatus = isCompleted ? 'completed' : 'aborted'
    const requestPath = getRequestPath(req) || 'unknown'
    const country = req.headers['cf-ipcountry'] as Optional<string>

    return {
      ...val,
      requestStatus,
      requestPath,
      country
    }
  },

  customErrorMessage() {
    return '{requestPath} request {requestStatus} in {responseTime} ms'
  },
  customErrorObject(req, _res, _err, val: Record<string, unknown>) {
    const requestStatus = 'failed'
    const requestPath = getRequestPath(req) || 'unknown'
    const country = req.headers['cf-ipcountry'] as Optional<string>

    return {
      ...val,
      requestStatus,
      requestPath,
      country
    }
  },

  // we need to redact any potential sensitive data from being logged.
  // as we do not know what headers may be sent in a request by a user or client
  // we have to allow list selected headers
  serializers: {
    req: pino.stdSerializers.wrapRequestSerializer((req) => {
      return {
        id: req.raw.id,
        method: req.raw.method,
        path: getRequestPath(req.raw),
        // Allowlist useful headers
        headers: sanitizeHeaders(req.raw.headers)
      }
    }),
    res: pino.stdSerializers.wrapResponseSerializer((res) => {
      const resRaw = res as SerializedResponse & {
        raw: {
          headers: Record<string, string>
        }
      }
      const serverRes = get(res, 'raw.raw') as ServerResponse
      const auth = serverRes.req.context
      const statusCode = res.statusCode || res.raw.statusCode || serverRes.statusCode

      return {
        statusCode,
        // Allowlist useful headers
        headers: Object.fromEntries(
          Object.entries(resRaw.raw.headers).filter(
            ([key]) =>
              ![
                'set-cookie',
                'authorization',
                'cf-connecting-ip',
                'true-client-ip',
                'x-real-ip',
                'x-forwarded-for',
                'x-original-forwarded-for'
              ].includes(key.toLocaleLowerCase())
          )
        ),
        userId: auth?.userId
      }
    })
  }
})

export const DetermineRequestIdMiddleware = (
  req: IncomingMessage,
  res: Response,
  next: NextFunction
) => {
  const id = DetermineRequestId(req)
  req.headers[REQUEST_ID_HEADER] = id
  res.setHeader(REQUEST_ID_HEADER, id)
  next()
}
