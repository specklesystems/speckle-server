const { getLogger, extendLoggerComponent } = require('@speckle/shared')

const logger = extendLoggerComponent(
  getLogger(process.env.LOG_LEVEL || 'info'),
  'webhook-service'
)

module.exports = {
  logger
}
