import { logger } from './logging'
import { randomUUID } from 'crypto'
import HttpLogger from 'pino-http'
import { IncomingMessage } from 'http'
import { NextFunction, Response } from 'express'
import pino, { SerializedResponse } from 'pino'
import { GenReqId } from 'pino-http'

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

export const LoggingExpressMiddleware = HttpLogger({
  logger,
  autoLogging: true,
  genReqId: GenerateRequestId,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }
    return 'info'
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["cf-connecting-ip"]',
      'req.headers["true-client-ip"]',
      'req.headers["x-real-ip"]',
      'req.headers["x-forwarded-for"]'
    ],
    censor: (value, path) => {
      if (
        path.includes('req.headers.authorization') &&
        typeof value === 'string' &&
        value.startsWith('bearer')
      ) {
        return `${value.slice(0, 17)}[TRUNCATED(original_length:${value.length})]`
      }
      return `[REDACTED(length:${value.length})]`
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
        path: req.raw.url?.split('?')[0], // Remove query params which might be sensitive
        // headers are managed by the redact config above
        headers: req.raw.headers
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
        headers: resRaw.raw.headers
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
