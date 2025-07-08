import { pino } from 'pino'
import type { LoggerOptions } from 'pino'
import { toClef, toClefLogLevel } from './pinoClef.js'
import { TIME_MS } from '../core/index.js'
import inspector from 'node:inspector'

let logger: pino.Logger
export type MixinFn = (mergeObject: object, level: number) => object
type LogLevelFormatter = (label: string, number: number) => object
type LogFormatter = (logObject: Record<string, unknown>) => Record<string, unknown>

const allowPrettyDebugger = ['1', 'true'].includes(
  process.env.ALLOW_PRETTY_DEBUGGER || 'false'
)
const debugNamespaces = (process.env.LOG_FILTER || '')
  .split(',')
  .filter((s) => !!s?.length)

const defaultLevelFormatterFactory =
  (pretty: boolean): LogLevelFormatter =>
  (label, number) =>
    // for not pretty, we're providing clef levels
    pretty ? { level: label } : toClefLogLevel(number)

const defaultLogFormatterFactory =
  (pretty: boolean): LogFormatter =>
  (logObject) =>
    pretty ? logObject : toClef(logObject)

export function getLogger(
  minimumLoggedLevel = 'info',
  pretty = false,
  mixin?: MixinFn
): pino.Logger {
  if (logger) return logger

  const pinoOptions: LoggerOptions = {
    base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
    formatters: {
      level: defaultLevelFormatterFactory(pretty),
      log: defaultLogFormatterFactory(pretty)
    },
    mixin,
    // when not pretty, to produce a clef format, we need the message to be the message template key
    messageKey: pretty ? 'msg' : '@mt',
    level: minimumLoggedLevel,
    // when not pretty, we need the time in the clef appropriate field, not from pino
    timestamp: pretty ? pino.stdTimeFunctions.isoTime : false,
    hooks: {
      logMethod(args, method) {
        // Invoke as is
        if (!debugNamespaces.length) {
          return method.apply(this, args)
        }

        // Filter out if component not in allowed debug namespaces
        const component = (this.bindings() as { component: string }).component
        if (debugNamespaces.includes(component)) {
          return method.apply(this, args)
        }

        // Otherwise, skip actually logging
      }
    }
  }

  // pino-pretty hangs in debugger mode in node 22 for some (Ubuntu/WSL2?), dunno why
  if (pretty && (allowPrettyDebugger || !inspector.url())) {
    pinoOptions.transport = {
      target: '@speckle/shared/pinoPrettyTransport.cjs',
      options: {
        colorize: true,
        destination: 2, //stderr
        // ignore: 'time',
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
    if (timestamp > lastDateTimestamp + TIME_MS.minute) {
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
