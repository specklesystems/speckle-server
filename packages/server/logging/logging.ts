// Note logging is imported by www & ts-www, prior to init() being called
// so we can't use local imports with '@' etc., as they aren't yet defined.
import { logger, extendLoggerComponent } from '@speckle/shared'
export { logger, extendLoggerComponent } from '@speckle/shared'

// loggers for phases of operation
export const startupLogger = logger.child({ phase: 'startup' })
export const dbStartupLogger = logger.child({ phase: 'db-startup' })
export const shutdownLogger = logger.child({ phase: 'shutdown' })

// loggers for specific components within normal operation
export const moduleLogger = extendLoggerComponent(logger, 'modules')
export const activitiesLogger = extendLoggerComponent(moduleLogger, 'activities')
export const cliLogger = extendLoggerComponent(logger, 'cli')
export const notificationsLogger = extendLoggerComponent(logger, 'notifications')
export const uploadEndpointLogger = extendLoggerComponent(logger, 'upload-endpoint')
export const dbLogger = extendLoggerComponent(logger, 'db')
export const servicesLogger = extendLoggerComponent(logger, 'services')
