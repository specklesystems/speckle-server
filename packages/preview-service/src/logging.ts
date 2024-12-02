import {
  extendLoggerComponent,
  getLogger
} from '@speckle/shared/dist/commonjs/observability/index.js'
import { LOG_LEVEL, LOG_PRETTY } from './config'

export const logger = extendLoggerComponent(
  getLogger(LOG_LEVEL, LOG_PRETTY),
  'preview-service'
)
