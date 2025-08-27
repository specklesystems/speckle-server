import { useFinalizeParallelMiddlewares } from '~/lib/core/helpers/middleware'

/**
 * Should be the very last middleware that's run on ALL pages and navigations
 */
export default defineNuxtRouteMiddleware(async () => {
  const { finalize } = useFinalizeParallelMiddlewares()
  return await finalize()
})
