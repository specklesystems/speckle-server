import type { NuxtApp } from '#app'
import type { Optional } from '@speckle/shared'
import { buildFakePinoLogger } from '~~/lib/core/helpers/observability'

export type AppLogger = ReturnType<typeof useLogger>

export const useLogger = () => {
  return useNuxtApp().$logger
}

/**
 * There are scopes where useNuxtApp() is available and we have to fall back to a different logger. This composable
 * can be invoked everywhere in all scopes (not in `server` code tho!) to get the best kind of logger available
 */
export const useSafeLogger = () => {
  let nuxtApp: Optional<NuxtApp> = undefined
  const fallbackSyncLogger = buildFakePinoLogger()
  let fallbackFullLogger: Optional<ReturnType<typeof buildFakePinoLogger>> = undefined

  const availableLogger = () =>
    nuxtApp?.$logger || fallbackFullLogger || fallbackSyncLogger

  const tryResolvingRealLogger = () => {
    // Try nuxt app
    try {
      nuxtApp = useNuxtApp()
    } catch {
      // suppress 'nuxt is not available'
    }
  }

  const tryResolvingLogger = async () => {
    try {
      tryResolvingRealLogger()
      if (nuxtApp?.$logger) return

      if (import.meta.server && !fallbackFullLogger) {
        const { buildLogger } = await import('~/server/lib/core/helpers/observability')
        fallbackFullLogger = buildLogger('info', import.meta.dev ? true : false) // no runtime config, so falling back to default settings
      }
    } catch (err) {
      availableLogger().error(err)
    }
  }

  const logger = () => {
    void tryResolvingLogger()
    if (nuxtApp?.$logger) return nuxtApp.$logger

    const err = new Error(
      'Nuxt app for logger not found! Initializing fallback structured logger...'
    )
    let logger: ReturnType<typeof buildFakePinoLogger>
    if (fallbackFullLogger) {
      logger = fallbackFullLogger
    } else {
      logger = fallbackSyncLogger
    }
    logger.error(err)

    return logger
  }

  void tryResolvingLogger()

  return {
    /**
     * Get the best available logger instance
     */
    logger,
    /**
     * If you're in a scope where you can invoke async code, invoke this to try to load the most appropriate logger
     */
    loadBestLogger: tryResolvingLogger
  }
}

/**
 * Short-cut to useLogger().debug, useful when you quickly want to console.log something during development.
 * Calls to this are skipped outside of dev mode.
 */
export const useDevLogger = () => {
  if (!import.meta.dev) return noop

  const { logger } = useSafeLogger()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    const actualLogger = logger()
    const debug = actualLogger.debug.bind(actualLogger)
    return debug(args[0], ...args.slice(1)) //ts appeasement
  }
}
