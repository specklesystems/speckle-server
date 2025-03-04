import Observability from '@speckle/shared/dist/commonjs/observability/index.js'

// loggers for specific components within normal operation
export const logger = Observability.extendLoggerComponent(
  Observability.getLogger(
    process.env.LOG_LEVEL || 'info',
    process.env.LOG_PRETTY === 'true'
  ),
  'fileimport-service'
)
