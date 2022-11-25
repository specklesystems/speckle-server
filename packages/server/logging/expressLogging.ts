import { logger } from './logging'
import HttpLogger from 'pino-http'

export const LoggingExpressMiddleware = HttpLogger({
  logger,
  autoLogging: false
})
