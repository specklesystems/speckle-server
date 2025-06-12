import * as Observability from '@speckle/shared/observability'

// loggers for specific components within normal operation
export const logger = Observability.extendLoggerComponent(
  Observability.getLogger(
    process.env.LOG_LEVEL || 'info',
    process.env.LOG_PRETTY === 'true' && !process.env.FORCE_NO_PRETTY
  ),
  'fileimport-service'
)
