import type { Optional } from '@speckle/shared'
import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import { loginServerInfoQuery } from '~/lib/auth/graphql/queries'
import { usePreloadApolloQueries } from '~/lib/common/composables/graphql'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { projectAccessCheckQuery } from '~/lib/projects/graphql/queries'

/**
 * Prefetches data for specific routes to avoid the problem of serial API requests
 * (e.g. in the case of multiple middlewares)
 */
export default defineNuxtPlugin(async (ctx) => {
  const logger = useLogger()
  const route = ctx._route
  const preload = usePreloadApolloQueries()

  if (!route) {
    logger.info('No route obj found, skipping data preload...')
    return
  }

  const path = route.path
  const idParam = route.params.id as Optional<string>
  const promises: Promise<unknown>[] = []

  // Standard/global
  promises.push(
    preload({
      queries: [{ query: activeUserQuery }, { query: mainServerInfoDataQuery }]
    })
  )

  // Preload project data
  if (idParam && path.startsWith('/projects/')) {
    promises.push(
      preload({
        queries: [
          {
            query: projectAccessCheckQuery,
            variables: { id: idParam },
            context: { skipLoggingErrors: true }
          }
        ]
      })
    )
  }

  // Preload viewer data
  if (route.meta.key === '/projects/:id/models/resources') {
    // Unable to preload this from vue components due to SSR being essentially turned off for the viewer
    promises.push(
      preload({
        queries: [{ query: loginServerInfoQuery }]
      })
    )
  }

  await Promise.all(promises)
})
