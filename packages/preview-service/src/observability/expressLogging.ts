import { logger } from '@/observability/logging'
import HttpLogger from 'pino-http'
import { randomUUID } from 'crypto'
import type { IncomingHttpHeaders, IncomingMessage } from 'http'
import { REQUEST_ID_HEADER } from '@/domain/const'

function determineRequestId(headers: IncomingHttpHeaders, uuidGenerator = randomUUID) {
  const idHeader = headers[REQUEST_ID_HEADER]
  if (!idHeader) return uuidGenerator()
  if (Array.isArray(idHeader)) return idHeader[0] ?? uuidGenerator()
  return idHeader
}

const generateReqId = (req: IncomingMessage) => determineRequestId(req.headers)

export const loggingExpressMiddleware = HttpLogger({
  genReqId: generateReqId,
  logger,
  autoLogging: true,
  // this is here, to force logging 500 responses as errors in the final log
  // and we don't really care about 3xx stuff
  // all the user related 4xx responses are treated as info
  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'info'
    } else if (res.statusCode >= 500 || error) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }

    return 'info' //default
  }
})
