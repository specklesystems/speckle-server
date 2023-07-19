/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { isObjectLike } from '~~/lib/common/helpers/type'
import { buildFakePinoLogger } from '~~/lib/core/helpers/observability'

/**
 * Pino logger in SSR, basic console.log fallback in CSR
 */

export default defineNuxtPlugin(async () => {
  const {
    public: {
      logLevel,
      logPretty,
      logClientApiToken,
      speckleServerVersion,
      logClientApiEndpoint,
      serverName
    }
  } = useRuntimeConfig()

  let logger: ReturnType<typeof import('@speckle/shared').Observability.getLogger>
  if (process.server) {
    const { buildLogger } = await import('~/server/lib/core/helpers/observability')
    logger = buildLogger(logLevel, logPretty)
  } else {
    // set up seq ingestion
    if (logClientApiToken?.length && logClientApiEndpoint?.length) {
      const seq = await import('seq-logging/browser')
      const seqLogger = new seq.Logger({
        serverUrl: logClientApiEndpoint,
        apiKey: logClientApiToken,
        onError: console.error
      })

      const errorListener = (
        event: ErrorEvent | PromiseRejectionEvent | string | Error | unknown
      ) => {
        const isUnhandledRejection = isObjectLike(event) && 'reason' in event
        let err: Error
        if (event instanceof Error) {
          err = event
        } else if (isObjectLike(event)) {
          if ('reason' in event && event.reason instanceof Error) {
            err = event.reason
          } else if ('error' in event && event.error instanceof Error) {
            err = event.error
          } else {
            err = new Error(`${JSON.stringify(event)}`)
          }
        } else {
          err = new Error(`${event}`)
        }

        seqLogger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {errorMessage}',
          properties: {
            errorMessage: err.message,
            browser: true,
            frontendType: 'frontend-2',
            speckleServerVersion,
            serverName,
            isUnhandledRejection
          },
          exception: err.stack
        })
      }

      window.addEventListener('error', errorListener)
      window.addEventListener('unhandledrejection', errorListener)

      logger = buildFakePinoLogger({ onError: errorListener })
      logger.debug('Set up seq ingestion...')
    } else {
      logger = buildFakePinoLogger()
    }
  }

  return {
    provide: {
      logger
    }
  }
})
