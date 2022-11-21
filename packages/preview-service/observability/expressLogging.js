const { previewServiceLogger } = require('./logging')
const ExpressPinoLogger = require('express-pino-logger')

module.exports.LoggingExpressMiddleware = ExpressPinoLogger({
  logger: previewServiceLogger,
  autoLogging: false
})
