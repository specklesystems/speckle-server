import { Observability } from '@speckle/shared'

export function buildLogger(logLevel: string = 'info', logPretty: boolean = false) {
  return Observability.getLogger(logLevel, logPretty)
}
