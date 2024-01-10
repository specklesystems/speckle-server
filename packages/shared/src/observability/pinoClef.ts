export const clefLevels = {
  60: 5, // FATAL
  50: 4, // ERROR
  40: 3, // WARN
  30: 2, // INFO = default when not provided
  20: 1, // DEBUG
  10: 0 // TRACE / Verbose
} as const

export function toClef(log: Record<string, unknown>): Record<string, unknown> {
  // add the stuff CLEF wants ....
  if (log.time) {
    log['@t'] = new Date(log.time as Date).toISOString()
  } else {
    log['@t'] = new Date().toISOString()
  }

  if (log.level && (log.level as number) in clefLevels) {
    log['@l'] = clefLevels[log.level as keyof typeof clefLevels]
  }

  const exception = log.error || log.err
  if (exception) {
    // Seq wants it as a string - try to prettify it with a legible stack trace
    log['@x'] = (exception as Error).stack
  }

  return log
}
