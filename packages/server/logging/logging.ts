// Note logging is imported by www & ts-www, prior to init() being called
// so we can't use imports with '@' etc., as they aren't yet defined.
import pino from 'pino'

export const Logger = pino({
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
export const startupLogger = Logger.child({ phase: 'startup' })
export const dbStartupLogger = Logger.child({ phase: 'db-startup' })
export const shutdownLogger = Logger.child({ phase: 'shutdown' })

export const extendLoggerComponent = function (
  otherChild: pino.Logger,
  ...subComponent: string[]
) {
  const otherChildBindings = otherChild.bindings()
  otherChildBindings.component = [otherChildBindings.component, ...subComponent]
    .filter(Boolean)
    .join('/')
  return Logger.child(otherChildBindings)
}

// loggers for specific components within normal operation
export const moduleLogger = extendLoggerComponent(Logger, 'modules')
export const activitiesLogger = extendLoggerComponent(moduleLogger, 'activities')
export const cliLogger = extendLoggerComponent(Logger, 'cli')
export const notificationsLogger = extendLoggerComponent(Logger, 'notifications')
export const uploadEndpointLogger = extendLoggerComponent(Logger, 'upload-endpoint')
export const dbLogger = extendLoggerComponent(Logger, 'db')
export const servicesLogger = extendLoggerComponent(Logger, 'services')
