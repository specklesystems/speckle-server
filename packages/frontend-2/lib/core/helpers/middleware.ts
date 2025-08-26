import type { RouteMiddleware } from '#app'
import type { NavigationGuardReturn } from '#vue-router'
import { isUndefinedOrVoid } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'

const useMiddlewareParallelizationState = () =>
  useScopedState('middleware_parallelization', () => ({
    middlewares: [] as Promise<NavigationGuardReturn>[]
  }))

/**
 * Make the middleware process in parallel with other middlewares and only get fully awaited at the end
 */
export const withParallelization = (middleware: RouteMiddleware): RouteMiddleware => {
  return (...args) => {
    const { middlewares } = useMiddlewareParallelizationState()
    middlewares.push(Promise.resolve(middleware(...args)))
  }
}

export const useFinalizeParallelMiddlewares = () => {
  const state = useMiddlewareParallelizationState()
  const logger = useLogger()

  return {
    finalize: async () => {
      const middlewares = state.middlewares
      if (!middlewares.length) {
        return
      }

      logger.debug('Finalizing {count} parallel middlewares', {
        count: middlewares.length,
        middlewares
      })
      const results = await Promise.all(middlewares).finally(() => {
        state.middlewares.length = 0
      })
      return results.find((r) => !isUndefinedOrVoid(r) && r !== true)
    }
  }
}
