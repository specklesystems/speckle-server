const { Observability } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = Observability.extendLoggerComponent(
  Observability.getLogger(
    process.env.LOG_LEVEL || 'info',
    process.env.LOG_PRETTY === 'true'
  ),
  'preview-service'
)
const serverLogger = Observability.extendLoggerComponent(logger, 'server')

module.exports = {
  logger,
  serverLogger
}
