import { useFinalizeParallelMiddlewares } from '~/lib/core/helpers/middleware'

/**
 * Using a very late router.beforeEach we simulate a final middleware that awaits parallel middlewares
 * were executed correctly
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { finalize } = useFinalizeParallelMiddlewares()

  router.beforeEach(async () => {
    return await finalize()
  })
})
