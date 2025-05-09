import { extendLoggerComponent, getLogger } from '@speckle/shared/observability'
import { LOG_LEVEL, LOG_PRETTY } from '@/config.js'

export const logger = extendLoggerComponent(
  getLogger(LOG_LEVEL, LOG_PRETTY),
  'preview-service'
)
