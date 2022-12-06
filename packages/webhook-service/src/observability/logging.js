const { Observability } = require('@speckle/shared')

const logger = Observability.extendLoggerComponent(
  Observability.getLogger(process.env.LOG_LEVEL || 'info'),
  'webhook-service'
)

module.exports = {
  logger
}
