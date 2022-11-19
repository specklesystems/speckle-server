import { Logger } from './logging'
import ExpressPinoLogger from 'express-pino-logger'

export const LoggingExpressMiddleware = ExpressPinoLogger({
  logger: Logger,
  autoLogging: false
})
