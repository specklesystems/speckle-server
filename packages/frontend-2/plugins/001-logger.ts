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
    const { Observability } = await import('@speckle/shared')
    logger = Observability.getLogger(logLevel, logPretty)
  } else {
    logger = buildFakePinoLogger()

    // set up seq ingestion
    if (!process.dev && logClientApiToken?.length && logClientApiEndpoint?.length) {
      const seq = await import('seq-logging/browser')
      const logger = new seq.Logger({
        serverUrl: logClientApiEndpoint,
        apiKey: logClientApiToken,
        onError: console.error
      })

      const errorListener = (event: ErrorEvent) => {
        logger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {errorMessage}',
          properties: {
            errorMessage: event.message,
            browser: true,
            frontendType: 'frontend-2',
            speckleServerVersion,
            serverName
          },
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          exception: event.error instanceof Error ? event.error.stack : `${event.error}`
        })
      }

      window.addEventListener('error', errorListener)
    }
  }

  return {
    provide: {
      logger
    }
  }
})
