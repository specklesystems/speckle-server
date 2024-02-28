/**
 * Sending SSR request health metrics to the logger
 */
export default defineNuxtPlugin((ctx) => {
  const router = useRouter()
  const logger = useLogger()

  const path = router.currentRoute.value?.matched?.[0]?.path || 'empty'
  const name = router.currentRoute.value?.name || 'empty'

  const state = {
    start: Date.now(),
    path: `${String(name)}: ${path}`
  }

  logger.debug(
    {
      routeName: name,
      routePath: path
    },
    '{routePath} SSR render started...'
  )

  ctx.hook('app:rendered', () => {
    const endTime = Date.now() - state.start
    logger.info(
      {
        responseTime: endTime,
        routeName: name,
        routePath: path
      },
      '{routePath} SSR rendered in {responseTime} ms'
    )
  })
})
