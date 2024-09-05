import { omit } from 'lodash-es'
import type { SetRequired } from 'type-fest'
import { useReadUserId } from '~/lib/auth/composables/activeUser'
import {
  useCreateErrorLoggingTransport,
  useGetErrorLoggingTransports,
  useLogToErrorLoggingTransports
} from '~/lib/core/composables/error'
import {
  useRequestId,
  useServerRequestId,
  useUserCountry
} from '~/lib/core/composables/server'
import { isObjectLike } from '~~/lib/common/helpers/type'
import {
  buildFakePinoLogger,
  enableCustomErrorHandling,
  type AbstractErrorHandler,
  type AbstractErrorHandlerParams,
  type AbstractUnhandledErrorHandler
} from '~~/lib/core/helpers/observability'

const simpleStripHtml = (str: string) => str.replace(/<[^>]*>?/gm, '')

/**
 * - Setting up Pino logger in SSR, basic console.log fallback in CSR
 * - Also sets up ability to add extra transport for other observability tools
 */

export default defineNuxtPlugin(async (nuxtApp) => {
  const {
    public: {
      logLevel,
      logPretty,
      logClientApiToken,
      speckleServerVersion,
      logClientApiEndpoint,
      serverName,
      logCsrEmitProps
    }
  } = useRuntimeConfig()
  const route = useRoute()
  const router = useRouter()
  const reqId = useRequestId()
  const serverReqId = useServerRequestId()
  const getUserId = useReadUserId()
  const country = useUserCountry()
  const registerErrorTransport = useCreateErrorLoggingTransport()
  const { invokeTransportsWithPayload } = useLogToErrorLoggingTransports()

  const collectMainInfo = (params: { isBrowser: boolean }) => {
    const info = {
      browser: params.isBrowser,
      speckleServerVersion,
      serverName,
      frontendType: 'frontend-2',
      route: route?.path,
      routeDefinition: route.matched?.[route.matched.length - 1]?.path,
      req: { id: reqId },
      userId: getUserId(),
      country: country.value,
      serverReqId: serverReqId.value
    }
    return info
  }

  // Set up logger
  let logger: ReturnType<
    typeof import('@speckle/shared/dist/esm/observability/index').getLogger
  >
  const errorHandlers: AbstractErrorHandler[] = []
  const unhandledErrorHandlers: AbstractUnhandledErrorHandler[] = []

  if (import.meta.server) {
    const { buildLogger, enableDynamicBindings, serializeRequest } = await import(
      '~/server/lib/core/helpers/observability'
    )
    logger = enableDynamicBindings(buildLogger(logLevel, logPretty).child({}), () => ({
      ...collectMainInfo({ isBrowser: false }),
      ...(nuxtApp.ssrContext
        ? { req: serializeRequest(nuxtApp.ssrContext.event.node.req) }
        : {})
    }))

    // Collect bindings for pino-http logger
    nuxtApp.hook('app:rendered', () => {
      if (!nuxtApp.ssrContext) return
      const bindings = collectMainInfo({ isBrowser: false })
      nuxtApp.ssrContext.event.node.res.vueLoggerBindings = omit(bindings, [
        'req',
        'res'
      ])
    })
  } else {
    const localTimeFormat = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'long'
    })
    const collectBrowserInfo = () => {
      const {
        userAgent,
        platform: navigatorPlatform,
        vendor: navigatorVendor
      } = navigator
      const url = window.location.href
      const localTime = localTimeFormat.format(new Date())

      // Get browser dimensions & screen dimensions
      const { innerWidth: browserWidth, innerHeight: browserHeight } = window
      const { width: screenWidth, height: screenHeight } = window.screen

      return {
        userAgent,
        navigatorPlatform,
        navigatorVendor,
        url,
        localTime,
        dimensions: {
          browser: { width: browserWidth, height: browserHeight },
          screen: { width: screenWidth, height: screenHeight }
        }
      }
    }

    const collectCoreInfo = () => ({
      ...collectBrowserInfo(),
      ...collectMainInfo({ isBrowser: true })
    })

    logger = buildFakePinoLogger({
      consoleBindings: logCsrEmitProps ? collectCoreInfo : undefined
    })

    // SEQ Browser integration
    if (logClientApiToken?.length && logClientApiEndpoint?.length) {
      const seq = await import('seq-logging/browser')
      const seqLogger = new seq.Logger({
        serverUrl: logClientApiEndpoint,
        apiKey: logClientApiToken,
        // eslint-disable-next-line no-console
        onError: console.error
      })

      const unhandledErrorLogger: AbstractUnhandledErrorHandler = ({
        error,
        message,
        isUnhandledRejection
      }) => {
        seqLogger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {mainSeqErrorMessage}',
          properties: {
            mainSeqErrorMessage: message,
            isUnhandledRejection,
            ...collectCoreInfo()
          },
          exception: error instanceof Error ? error.stack : `${error}`
        })
      }
      unhandledErrorHandlers.push(unhandledErrorLogger)

      const errorLogger: AbstractErrorHandler = ({
        args,
        firstString,
        firstError,
        otherData,
        nonObjectOtherData
      }) => {
        if (!args.length) return

        const errorMessage = firstError?.message ?? firstString ?? `Unknown error`
        const exception =
          firstError?.stack ??
          new Error(
            'No Error instance was thrown, thus the following stack trace is synthesized manually'
          ).stack

        seqLogger.emit({
          timestamp: new Date(),
          level: 'error',
          messageTemplate: 'Client-side error: {mainSeqErrorMessage}',
          properties: {
            mainSeqErrorMessage: errorMessage, // weird name to avoid collision with otherData
            extraData: nonObjectOtherData,
            ...otherData,
            ...collectCoreInfo()
          },
          exception
        })
      }
      errorHandlers.push(errorLogger)
      logger.debug('Set up seq ingestion...')
    }
  }

  // Register seq transports, if any
  if (errorHandlers.length) {
    registerErrorTransport({
      onError: (...params) => {
        errorHandlers.forEach((handler) => handler(...params))
      },
      onUnhandledError: (event) => {
        unhandledErrorHandlers.forEach((handler) => handler(event))
      }
    })
  }

  // Global error handler - handle all transports besides the core pino/console.log logger
  const transports = useGetErrorLoggingTransports()
  logger = enableCustomErrorHandling({
    logger,
    onError: (params, helpers) => {
      transports.forEach((handler) => handler.onError(params, helpers))
    }
  })

  // Unhandled error handler
  if (import.meta.client && window) {
    const unhandledHandler = (event: ErrorEvent | PromiseRejectionEvent) => {
      const handlers = transports.filter(
        (t): t is SetRequired<typeof t, 'onUnhandledError'> => !!t.onUnhandledError
      )

      const isUnhandledRejection = isObjectLike(event) && 'reason' in event
      const error = ('reason' in event ? event.reason : event.error) as unknown
      const message = error instanceof Error ? error.message : `${error}`

      handlers.forEach((handler) =>
        handler.onUnhandledError({ event, isUnhandledRejection, error, message })
      )
    }

    window.addEventListener('error', unhandledHandler)
    window.addEventListener('unhandledrejection', unhandledHandler)
  }

  // Uncaught routing error handler
  router.onError((err, to, from) => {
    // skip 404, 403, 401
    if (isObjectLike(err) && 'statusCode' in err) {
      if ([404, 403, 401].includes(err.statusCode as number)) return
    }

    logger.error(err, 'Unhandled error in routing', {
      to: to.path,
      from: from?.path,
      isAppError: !!import.meta.server
    })
  })

  // More error logging hooks
  nuxtApp.vueApp.config.errorHandler = (error, _vm, info) => {
    logger.error(error, 'Unhandled error in Vue app', info)
  }
  nuxtApp.hook('app:error', (error) => {
    logger.error(error, 'Unhandled app error', {
      isAppError: true
    })
  })

  // Hydrate server fatal error to CSR
  if (!import.meta.server) {
    nuxtApp.hook('app:mounted', () => {
      const serverFatalError = nuxtApp.payload.error
      if (serverFatalError && serverFatalError.statusCode >= 500) {
        const msg = serverFatalError.message || 'Fatal server error'
        const stack = serverFatalError.stack
          ? simpleStripHtml(serverFatalError.stack)
          : undefined
        const finalStack = `${msg}${stack ? `\n${stack}` : ''}`

        const nuxtError = createError({
          ...serverFatalError,
          ...(finalStack ? { stack: finalStack } : {})
        })

        const payload: AbstractErrorHandlerParams = {
          args: ['Fatal server error', serverFatalError],
          firstError: nuxtError,
          firstString: 'Fatal server error',
          otherData: { isAppError: true },
          nonObjectOtherData: []
        }
        invokeTransportsWithPayload(payload)

        if (import.meta.dev) {
          // intentionally skipping error pipeline:
          // eslint-disable-next-line no-console
          console.error('Fatal error occurred on server:', payload)
        }
      }
    })
  }

  return {
    provide: {
      logger
    }
  }
})
