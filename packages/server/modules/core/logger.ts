import { extendLoggerComponent, moduleLogger } from '@/logging/logging'

export const coreLogger = extendLoggerComponent(moduleLogger, 'core')
