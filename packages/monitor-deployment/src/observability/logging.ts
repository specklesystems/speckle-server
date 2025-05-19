import { getLogLevel, isLogPretty } from '@/utils/env.js'
import { extendLoggerComponent, getLogger } from '@speckle/shared/observability'

export { extendLoggerComponent }

export const logger = extendLoggerComponent(
  getLogger(getLogLevel(), isLogPretty()),
  'monitor-deployment'
)
export const serverLogger = extendLoggerComponent(logger, 'server')
export const testLogger = getLogger(getLogLevel(), isLogPretty())
export const knexLogger = extendLoggerComponent(logger, 'knex')
