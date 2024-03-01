import type { Optional } from '@speckle/shared'
import type pino from 'pino'
import { buildLogger } from '~/server/lib/core/helpers/observability'

let logger: Optional<pino.Logger> = undefined

const createLogger = () => {
  const {
    public: { logLevel, logPretty, speckleServerVersion, serverName }
  } = useRuntimeConfig()

  const logger = buildLogger(logLevel, logPretty).child({
    browser: false,
    speckleServerVersion,
    serverName,
    frontendType: 'frontend-2',
    serverLogger: true
  })

  return logger
}

export const useLogger = () => {
  if (!logger) {
    logger = createLogger()
  }

  return logger
}
