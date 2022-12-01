const { pino } = require('pino')

const logger = pino({
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
  return otherChild.child(otherChildBindings)
}

module.exports = {
  logger,
  extendLoggerComponent
}
