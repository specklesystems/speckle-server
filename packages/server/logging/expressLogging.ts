import { logger } from './logging'
import ExpressPinoLogger from 'express-pino-logger'

export const LoggingExpressMiddleware = ExpressPinoLogger({
  logger,
  autoLogging: false
})
