import { buildLogger } from '~/server/lib/core/helpers/observability'
import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin((nitroApp) => {
  const {
    public: { logLevel, logPretty }
  } = useRuntimeConfig()
  const logger = buildLogger(logLevel, logPretty)
  nitroApp.hooks.hook('close', () => {
    logger.warn('Closing down the server, bye bye!')
  })
})
