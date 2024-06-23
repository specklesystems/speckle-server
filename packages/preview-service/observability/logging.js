const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')
const { getLogLevel, isLogPretty } = require('../utils/env')

// loggers for specific components within normal operation
const logger = Observability.extendLoggerComponent(
  Observability.getLogger(getLogLevel(), isLogPretty()),
  'preview-service'
)
const serverLogger = Observability.extendLoggerComponent(logger, 'server')

module.exports = {
  logger,
  serverLogger,
  extendLoggerComponent: Observability.extendLoggerComponent
}
