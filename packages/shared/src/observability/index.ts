import { pino } from 'pino'
import type { LoggerOptions } from 'pino'
import { toClef, clefLevels } from './pinoClef.js'

let logger: pino.Logger
type MixinFn = (mergeObject: object, level: number) => object

export function getLogger(
  logLevel = 'info',
  pretty = false,
  mixin?: MixinFn
): pino.Logger {
  if (logger) return logger

  const pinoOptions: LoggerOptions = {
    base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
    formatters: {
      level: (label: string, number: number) =>
        // for not pretty, we're providing clef levels
        pretty
          ? { level: label }
          : {
              '@l':
                number in clefLevels
                  ? clefLevels[number as keyof typeof clefLevels]
                  : clefLevels[30]
            },
      log: (logObject) => (pretty ? logObject : toClef(logObject))
    },
    mixin,
    // when not pretty, to produce a clef format, we need the message to be the message template key
    messageKey: pretty ? 'msg' : '@mt',
    level: logLevel,
    // when not pretty, we need the time in the clef appropriate field, not from pino
    timestamp: pretty ? pino.stdTimeFunctions.isoTime : false
  }

  if (pretty) {
    pinoOptions.transport = {
      target: '@speckle/shared/pinoPrettyTransport.cjs',
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

/**
 * Very simple RPM counter to catch extreme spam scenarios (e.g. a ton of errors being thrown). It's not going
 * to always report accurately, but as long as hits are being registered consistently it should be accurate enough.
 */
export function simpleRpmCounter() {
  const getTimestamp = () => new Date().getTime()
  let lastDateTimestamp = getTimestamp()
  let hits = 0

  const validateHits = () => {
    const timestamp = getTimestamp()
    if (timestamp > lastDateTimestamp + 60 * 1000) {
      hits = 0
      lastDateTimestamp = timestamp
    }
  }

  return {
    hit: () => {
      validateHits()
      return ++hits
    },
    get: () => {
      validateHits()
      return hits
    }
  }
}
