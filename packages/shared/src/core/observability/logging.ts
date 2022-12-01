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
