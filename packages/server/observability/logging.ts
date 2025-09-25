// Note logging is imported by www & ts-www, prior to init() being called
// so we can't use local imports with '@' etc., as they aren't yet defined.
import * as Observability from '@speckle/shared/observability'
import debug from 'debug'

const { getLogger, extendLoggerComponent } = Observability

export const logger = getLogger(
  process.env.LOG_LEVEL || 'info',
  process.env.LOG_PRETTY === 'true' && !process.env.FORCE_NO_PRETTY
)
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
export const rateLimiterLogger = extendLoggerComponent(logger, 'rate-limiter')
export const redisLogger = extendLoggerComponent(logger, 'redis')
export const dbNotificationLogger = extendLoggerComponent(logger, 'db-notifications')
export const mixpanelLogger = extendLoggerComponent(logger, 'mixpanel')
export const graphqlLogger = extendLoggerComponent(logger, 'graphql')
export const authLogger = extendLoggerComponent(logger, 'auth')
export const crossServerSyncLogger = extendLoggerComponent(logger, 'cross-server-sync')
export const automateLogger = extendLoggerComponent(logger, 'automate')
export const subscriptionLogger = extendLoggerComponent(logger, 'subscription')
export const healthCheckLogger = extendLoggerComponent(logger, 'healthcheck')
export const fileUploadsLogger = extendLoggerComponent(logger, 'file-uploads')
export const emailLogger = extendLoggerComponent(logger, 'email')
export const taskSchedulerLogger = extendLoggerComponent(logger, 'task-scheduler')
export const cacheLogger = extendLoggerComponent(logger, 'cache')
export const previewLogger = extendLoggerComponent(logger, 'preview')
export const viewerLogger = extendLoggerComponent(logger, 'viewer')

// export const testLogger = (() => {
//   const dbg = debug('speckle:test')
//   return {
//     debug: dbg,
//     info: dbg,
//     warn: dbg,
//     error: dbg
//   }
// })()
export const testLogger = extendLoggerComponent(logger, 'test')

export type Logger = typeof logger
export { extendLoggerComponent, Observability }
