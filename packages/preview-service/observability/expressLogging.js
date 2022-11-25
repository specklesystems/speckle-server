const { logger } = require('./logging')
const HttpLogger = require('pino-http')()

module.exports.LoggingExpressMiddleware = HttpLogger({
  logger,
  autoLogging: false
})
