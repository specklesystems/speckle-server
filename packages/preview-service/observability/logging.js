const { logger: baseLogger, extendLoggerComponent } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = extendLoggerComponent(baseLogger, 'preview-service')
const serverLogger = extendLoggerComponent(logger, 'server')

module.exports = {
  logger,
  serverLogger
}
