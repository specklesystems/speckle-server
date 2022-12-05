const { getLogger, extendLoggerComponent } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = extendLoggerComponent(
  getLogger(process.env.LOG_LEVEL || 'info'),
  'preview-service'
)
const serverLogger = extendLoggerComponent(logger, 'server')

module.exports = {
  logger,
  serverLogger
}
