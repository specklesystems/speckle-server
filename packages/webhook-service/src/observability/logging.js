const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')

const logger = Observability.extendLoggerComponent(
  Observability.getLogger(
    process.env.LOG_LEVEL || 'info',
    process.env.LOG_PRETTY === 'true'
  ),
  'webhook-service'
)

module.exports = {
  logger
}
