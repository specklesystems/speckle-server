import { getLogLevel, isLogPretty } from '#src/utils/env.js'
import {
  extendLoggerComponent as elc,
  getLogger
} from '@speckle/shared/dist/commonjs/observability/index.js'
export const extendLoggerComponent = elc

export const logger = extendLoggerComponent(
  getLogger(getLogLevel(), isLogPretty()),
  'preview-service'
)
export const serverLogger = extendLoggerComponent(logger, 'server')
export const testLogger = getLogger(getLogLevel(), isLogPretty())
