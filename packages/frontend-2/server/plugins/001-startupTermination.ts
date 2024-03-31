export default defineNitroPlugin((nitroApp) => {
  const logger = useLogger()
  logger.info('Starting up the server, hello!')

  nitroApp.hooks.hook('close', () => {
    logger.warn('Closing down the server, bye bye!')
  })
})
