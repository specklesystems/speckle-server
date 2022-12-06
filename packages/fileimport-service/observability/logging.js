const { Observability } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = Observability.extendLoggerComponent(
  Observability.getLogger(process.env.LOG_LEVEL || 'info'),
  'fileimport-service'
)

module.exports = {
  logger
}
