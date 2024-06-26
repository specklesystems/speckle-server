const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')

// loggers for specific components within normal operation
const logger = Observability.extendLoggerComponent(
  Observability.getLogger(
    process.env.LOG_LEVEL || 'info',
    process.env.LOG_PRETTY === 'true'
  ),
  'knex-metrics-debugger'
)

module.exports = {
  logger
}
