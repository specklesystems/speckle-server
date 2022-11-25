// Note logging is imported by www & ts-www, prior to init() being called
// so we can't use imports with '@' etc., as they aren't yet defined.
import pino from 'pino'

export const logger = pino({
  base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime
})

// loggers for phases of operation
export const startupLogger = logger.child({ phase: 'startup' })
export const dbStartupLogger = logger.child({ phase: 'db-startup' })
export const shutdownLogger = logger.child({ phase: 'shutdown' })

export const extendLoggerComponent = function (
  otherChild: pino.Logger,
  ...subComponent: string[]
) {
  const otherChildBindings = otherChild.bindings()
  otherChildBindings.component = [otherChildBindings.component, ...subComponent]
    .filter(Boolean)
    .join('/')
  return otherChild.child(otherChildBindings)
}

// loggers for specific components within normal operation
export const moduleLogger = extendLoggerComponent(logger, 'modules')
export const activitiesLogger = extendLoggerComponent(moduleLogger, 'activities')
export const cliLogger = extendLoggerComponent(logger, 'cli')
export const notificationsLogger = extendLoggerComponent(logger, 'notifications')
export const uploadEndpointLogger = extendLoggerComponent(logger, 'upload-endpoint')
export const dbLogger = extendLoggerComponent(logger, 'db')
export const servicesLogger = extendLoggerComponent(logger, 'services')
