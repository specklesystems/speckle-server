import type { RouteMiddleware } from '#app'
import type { NavigationGuardReturn } from '#vue-router'
import { isUndefinedOrVoid } from '@speckle/shared'
import { useScopedState } from '~/lib/common/composables/scopedState'

const useMiddlewareParallelizationState = () =>
  useScopedState('middleware_parallelization', () => ({
    middlewares: [] as Array<() => Promise<NavigationGuardReturn>>
  }))

/**
 * Make the middleware process in parallel with other middlewares and only get fully awaited at the end
 */
const withParallelization = (middleware: RouteMiddleware): RouteMiddleware => {
  return (...args) => {
    const app = useNuxtApp()
    const {
      public: { parallelMiddlewares }
    } = useRuntimeConfig()
    if (!parallelMiddlewares) {
      return middleware(...args)
    }

    const { middlewares } = useMiddlewareParallelizationState()
    middlewares.push(async () => app.runWithContext(() => middleware(...args)))
  }
}

/**
 * defineParallelizedNuxtRouteMiddleware() w/ parallelization support
 */
export const defineParallelizedNuxtRouteMiddleware = (
  middleware: RouteMiddleware
): RouteMiddleware => {
  return withParallelization(middleware)
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

      try {
        const results = await Promise.all(middlewares.map((m) => m()))

        // Report results
        for (const resultItem of results) {
          if (!isUndefinedOrVoid(resultItem) && resultItem !== true) {
            return resultItem
          }
        }
      } finally {
        state.middlewares.length = 0
      }
    }
  }
}
