import { noop } from 'lodash-es'

/**
 * Pino logger in SSR, basic console.log fallback in CSR
 */

export default defineNuxtPlugin(async () => {
  const {
    public: { logLevel, logPretty }
  } = useRuntimeConfig()

  let logger: ReturnType<typeof import('@speckle/shared').Observability.getLogger>
  if (process.server) {
    const { Observability } = await import('@speckle/shared')
    logger = Observability.getLogger(logLevel, logPretty)
  } else {
    logger = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      fatal: console.error,
      trace: console.debug,
      silent: noop
    } as ReturnType<typeof import('@speckle/shared').Observability.getLogger>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    logger.child = () => logger as any
  }

  return {
    provide: {
      logger
    }
  }
})
