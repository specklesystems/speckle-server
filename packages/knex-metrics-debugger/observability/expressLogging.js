const { logger } = require('./logging')
const { pinoHttp } = require('pino-http')

module.exports.LoggingExpressMiddleware = pinoHttp({
  logger,
  autoLogging: false
})
