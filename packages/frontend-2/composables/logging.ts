import type { NuxtApp } from '#app'
import type { Optional } from '@speckle/shared'
import { buildFakePinoLogger } from '~~/lib/core/helpers/observability'

export type AppLogger = ReturnType<typeof useLogger>

export const useLogger = () => {
  return useNuxtApp().$logger
}

/**
 * Use when you need to be sure that the real structured pino logger is available
 * (it isn't in some early startup contexts like apollo link setup)
 */
export const useStrictLogger = async (
  options?: Partial<{ dontNotifyFallback: boolean }>
) => {
  const { dontNotifyFallback } = options || {}

  let nuxtApp: Optional<NuxtApp> = undefined
  try {
    nuxtApp = useNuxtApp()
  } catch (e) {
    // suppress 'nuxt is not available'
  }

  if (nuxtApp?.$logger) return nuxtApp?.$logger

  // Nuxt app not found in this scope
  const err = new Error(
    'Nuxt app for logger not found! Initializing fallback structured logger...'
  )

  let logger: ReturnType<typeof buildFakePinoLogger>
  if (process.server) {
    const { buildLogger } = await import('~/server/lib/core/helpers/observability')
    logger = buildLogger('info', process.dev ? true : false) // no runtime config, so falling back to default settings
  } else {
    logger = buildFakePinoLogger()
  }

  if (!dontNotifyFallback) logger.error(err)

  return logger
}
