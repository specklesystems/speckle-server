import { useRuntimeConfig } from '#imports'
import { buildLogger } from '~/server/lib/core/helpers/observability'

export default defineNitroPlugin((nitroApp) => {
  const {
    public: { logLevel, logPretty }
  } = useRuntimeConfig()
  const logger = buildLogger(logLevel, logPretty)
  nitroApp.hooks.hook('close', () => {
    logger.warn('Closing down the server, bye bye!')
  })
})
