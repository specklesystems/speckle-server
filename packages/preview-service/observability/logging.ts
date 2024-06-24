import Observability from '@speckle/shared/dist/commonjs/observability/index.js'
import { getLogLevel, isLogPretty } from '../utils/env'
export const extendLoggerComponent = Observability.extendLoggerComponent

export const logger = Observability.extendLoggerComponent(
  Observability.getLogger(getLogLevel(), isLogPretty()),
  'preview-service'
)
export const serverLogger = Observability.extendLoggerComponent(logger, 'server')
