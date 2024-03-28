export default defineNitroPlugin((nitroApp) => {
  const logger = useLogger()
  nitroApp.hooks.hook('close', () => {
    logger.warn('Closing down the server, bye bye!')
  })
})
