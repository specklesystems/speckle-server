import { logger } from './logging'
import { randomUUID } from 'crypto'
import HttpLogger from 'pino-http'
import { IncomingMessage } from 'http'
import { NextFunction, Response } from 'express'
import pino, { SerializedResponse } from 'pino'
import { GenReqId } from 'pino-http'
import { X_SPECKLE_CLIENT_IP_HEADER } from '@/modules/shared/middleware'
import { AuthContext } from '@/modules/shared/authz'

const REQUEST_ID_HEADER = 'x-request-id'

interface RawRequestWithAuthContext extends IncomingMessage {
  context: AuthContext
}

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
        headers: Object.fromEntries(
          Object.entries(req.raw.headers).filter(([key]) => {
            if (
              (req.raw as RawRequestWithAuthContext).context?.userId &&
              key.toLocaleLowerCase() === X_SPECKLE_CLIENT_IP_HEADER
            ) {
              // we cannot log the IP (even if hashed) if we also have a User ID
              // Having both together could be used to link an IP to a specific User
              // and that's a privacy issue.
              return false
            }
            ![
              'cookie',
              'authorization',
              'cf-connecting-ip',
              'true-client-ip',
              'x-real-ip',
              'x-forwarded-for'
            ].includes(key.toLocaleLowerCase())
          })
        )
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
  res.setHeader(REQUEST_ID_HEADER, id)
  next()
}
