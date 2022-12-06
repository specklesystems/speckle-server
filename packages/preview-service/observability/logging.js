const { Observability } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = Observability.extendLoggerComponent(
  Observability.getLogger(process.env.LOG_LEVEL || 'info'),
  'preview-service'
)
const serverLogger = Observability.extendLoggerComponent(logger, 'server')

module.exports = {
  logger,
  serverLogger
}
