import {
  extendLoggerComponent as elc,
  getLogger
} from '@speckle/shared/dist/commonjs/observability/index.js'
import { getLogLevel, isLogPretty } from '../utils/env'
export const extendLoggerComponent = elc

export const logger = extendLoggerComponent(
  getLogger(getLogLevel(), isLogPretty()),
  'preview-service'
)
export const serverLogger = extendLoggerComponent(logger, 'server')
export const testLogger = getLogger(getLogLevel(), isLogPretty())
