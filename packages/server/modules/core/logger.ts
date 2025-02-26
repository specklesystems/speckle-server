import { extendLoggerComponent, moduleLogger } from '@/observability/logging'

export const coreLogger = extendLoggerComponent(moduleLogger, 'core')
