// Note logging is imported by www & ts-www, prior to init() being called
// so we can't use imports with '@' etc., as they aren't yet defined.
const { pino } = require('pino')

const Logger = pino({
  base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime
})

const extendLoggerComponent = function (otherChild, ...subComponent) {
  const otherChildBindings = otherChild.bindings()
  otherChildBindings.component = [otherChildBindings.component, ...subComponent]
    .filter(Boolean)
    .join('/')
  return Logger.child(otherChildBindings)
}

// loggers for specific components within normal operation
const fileimportServiceLogger = extendLoggerComponent(Logger, 'fileimport-service')

module.exports = {
  fileimportServiceLogger
}
