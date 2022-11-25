const { logger } = require('./logging')
const ExpressPinoLogger = require('express-pino-logger')

module.exports.LoggingExpressMiddleware = ExpressPinoLogger({
  logger,
  autoLogging: false
})
