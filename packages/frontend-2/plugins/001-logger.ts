/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { isString } from 'lodash-es'
import { useRequestId } from '~/lib/core/composables/server'
import { isObjectLike } from '~~/lib/common/helpers/type'
import { buildFakePinoLogger } from '~~/lib/core/helpers/observability'

/**
 * Setting up Pino logger in SSR, basic console.log fallback in CSR
 */

export default defineNuxtPlugin(async (nuxtApp) => {
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
  const route = useRoute()
  const router = useRouter()
  const reqId = useRequestId()

  const collectMainInfo = (params: { isBrowser: boolean }) => {
    return {
      browser: params.isBrowser,
      speckleServerVersion,
      serverName,
      frontendType: 'frontend-2',
      route: route?.path,
      routeDefinition: route.matched?.[route.matched.length - 1]?.path,
      req: { id: reqId }
    }
  }

  // Set up logger
  let logger: ReturnType<typeof import('@speckle/shared').Observability.getLogger>
  if (process.server) {
    const { buildLogger } = await import('~/server/lib/core/helpers/observability')
    logger = buildLogger(logLevel, logPretty).child({
      ...collectMainInfo({ isBrowser: false })
    })
  } else {
    if (logClientApiToken?.length && logClientApiEndpoint?.length) {
      const seq = await import('seq-logging/browser')
      const seqLogger = new seq.Logger({
        serverUrl: logClientApiEndpoint,
        apiKey: logClientApiToken,
        // eslint-disable-next-line no-console
        onError: console.error
      })

      const collectBrowserInfo = () => {
        const {
          userAgent,
          platform: navigatorPlatform,
          vendor: navigatorVendor
        } = navigator
        const url = window.location.href

        return { userAgent, navigatorPlatform, navigatorVendor, url }
      }

      const collectCoreInfo = () => ({
        ...collectBrowserInfo(),
        ...collectMainInfo({ isBrowser: true })
      })

      const errorListener = (event: ErrorEvent | PromiseRejectionEvent) => {
        const isUnhandledRejection = isObjectLike(event) && 'reason' in event
        const err = ('reason' in event ? event.reason : event.error) as unknown
        const msg = err instanceof Error ? err.message : `${err}`

        seqLogger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {errorMessage}',
          properties: {
            errorMessage: msg,
            isUnhandledRejection,
            ...collectCoreInfo()
          },
          exception: err instanceof Error ? err.stack : `${err}`
        })
      }

      const customLogger = (...args: unknown[]) => {
        if (!args.length) return
        const firstString = args.find(isString)
        const firstError = args.find((arg): arg is Error => arg instanceof Error)
        const otherData: unknown[] = args.filter(
          (o) => !(o instanceof Error) && o !== firstString
        )

        const errorMessage = firstError?.message ?? firstString ?? `Unknown error`
        const exception =
          firstError?.stack ??
          new Error(
            'No Error instance was thrown, thus the following stack trace is synthesized manually'
          ).stack

        if (errorMessage !== firstString) {
          otherData.unshift(firstString)
        }

        const otherDataObjects = otherData.filter(isObjectLike)
        const otherDataNonObjects = otherData.filter((o) => !isObjectLike(o))
        const mergedOtherDataObject = Object.assign({}, ...otherDataObjects) as Record<
          string,
          unknown
        >

        seqLogger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {mainSeqErrorMessage}',
          properties: {
            mainSeqErrorMessage: errorMessage, // weird name to avoid collision with otherData
            extraData: otherDataNonObjects,
            ...mergedOtherDataObject,
            ...collectCoreInfo()
          },
          exception
        })
      }

      window.addEventListener('error', errorListener)
      window.addEventListener('unhandledrejection', errorListener)

      logger = buildFakePinoLogger({ onError: customLogger })
      logger.debug('Set up seq ingestion...')
    } else {
      logger = buildFakePinoLogger()
    }
  }

  // Set up global error handler
  nuxtApp.vueApp.config.errorHandler = (err, _vm, info) => {
    logger.error(err, 'Unhandled error in Vue app', info)
  }

  // Uncaught routing error handler
  router.onError((err, to, from) => {
    // skip 404
    if (isObjectLike(err) && 'statusCode' in err) {
      if ([404].includes(err.statusCode as number)) return
    }

    logger.error(err, 'Unhandled error in routing', {
      to: to.path,
      from: from?.path
    })
  })

  return {
    provide: {
      logger
    }
  }
})
