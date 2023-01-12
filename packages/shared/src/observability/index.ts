import pino, { LoggerOptions } from 'pino'

let logger: pino.Logger

export function getLogger(logLevel = 'info', pretty = false): pino.Logger {
  if (logger) return logger

  const pinoOptions: LoggerOptions = {
    base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
    formatters: {
      level: (label: string) => {
        return { level: label }
      }
    },
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  }

  if (pretty) {
    pinoOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        destination: 2, //stderr
        ignore: 'time',
        levelFirst: true,
        singleLine: true
      }
    }
  }

  logger = pino(pinoOptions)
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
