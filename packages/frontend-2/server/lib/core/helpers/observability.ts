import { Observability } from '@speckle/shared'

export function buildLogger(logLevel: string, logPretty: boolean) {
  return Observability.getLogger(logLevel, logPretty)
}
