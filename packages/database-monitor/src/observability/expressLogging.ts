import { REQUEST_ID_HEADER } from '@/domain/const.js'
import { logger } from '@/observability/logging.js'
import { randomUUID } from 'crypto'
import type { Request } from 'express'
import type { IncomingHttpHeaders, IncomingMessage } from 'http'
import { get } from 'lodash-es'
import { pinoHttp } from 'pino-http'
import pino from 'pino'
import { parse } from 'url'

function determineRequestId(headers: IncomingHttpHeaders, uuidGenerator = randomUUID) {
  const idHeader = headers[REQUEST_ID_HEADER]
  if (!idHeader) return uuidGenerator()
  if (Array.isArray(idHeader)) return idHeader[0] ?? uuidGenerator()
  return idHeader
}

const generateReqId = (req: IncomingMessage) => determineRequestId(req.headers)

export const loggingExpressMiddleware = pinoHttp({
  genReqId: generateReqId,
  logger,
  autoLogging: true,
  // this is here, to force logging 500 responses as errors in the final log
  // and we don't really care about 3xx stuff
  // all the user related 4xx responses are treated as info
  customLogLevel: (req, res, error) => {
    const path = getRequestPath(req)
    const shouldBeDebug = ['/metrics'].includes(path || '') ?? false

    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || error) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }

    return shouldBeDebug ? 'debug' : 'info'
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
        // Denylist potentially sensitive query parameters
        pathParameters: sanitizeQueryParams(getRequestParameters(req.raw)),
        // Denylist potentially sensitive headers
        headers: sanitizeHeaders(req.raw.headers)
      }
    })
  }
})

const getRequestPath = (req: IncomingMessage | Request) => {
  const path = ((get(req, 'originalUrl') || get(req, 'url') || '') as string).split(
    '?'
  )[0]
  return path?.length ? path : null
}

const getRequestParameters = (req: IncomingMessage | Request) => {
  const maybeUrl = (get(req, 'originalUrl') as string) || get(req, 'url') || ''
  const url = parse(maybeUrl, true)
  return url.query || {}
}

const sanitizeHeaders = (headers: Record<string, unknown>) =>
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

const sanitizeQueryParams = (query: Record<string, string | string[] | undefined>) => {
  Object.keys(query).forEach(function (key) {
    if (['code', 'state'].includes(key.toLocaleLowerCase())) {
      query[key] = '******'
    }
  })
  return query
}
