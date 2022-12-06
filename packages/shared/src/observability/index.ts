import pino from 'pino'

let logger: pino.Logger

export function getLogger(logLevel = 'info'): pino.Logger {
  if (logger) return logger

  logger = pino({
    base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
    formatters: {
      level: (label) => {
        return { level: label }
      }
    },
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  })
  return logger
}

export function extendLoggerComponent(
  otherChild: pino.Logger,
  ...subComponent: string[]
): pino.Logger {
  const otherChildBindings = otherChild.bindings()
  otherChildBindings.component = [otherChildBindings.component, ...subComponent]
    .filter(Boolean)
    .join('/')
  return otherChild.child(otherChildBindings)
}
