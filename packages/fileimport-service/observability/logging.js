const { getLogger, extendLoggerComponent } = require('@speckle/shared')

// loggers for specific components within normal operation
const logger = extendLoggerComponent(
  getLogger(process.env.LOG_LEVEL || 'info'),
  'fileimport-service'
)

module.exports = {
  logger
}
