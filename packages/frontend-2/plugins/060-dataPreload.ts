import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import {
  authLoginPanelQuery,
  authLoginPanelWorkspaceInviteQuery
} from '~/lib/auth/graphql/queries'
import { usePreloadApolloQueries } from '~/lib/common/composables/graphql'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { navigationWorkspaceSwitcherQuery } from '~/lib/navigation/graphql/queries'

/**
 * Prefetches data for specific routes to avoid the problem of serial API requests
 * (e.g. in the case of multiple middlewares)
 */
export default defineNuxtPlugin(async (ctx) => {
  const logger = useLogger()
  const route = ctx._route
  const preload = usePreloadApolloQueries()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  if (!route) {
    logger.info('No route obj found, skipping data preload...')
    return
  }

  const promises: Promise<unknown>[] = []

  // Standard/global
  promises.push(
    preload({
      queries: [
        { query: activeUserQuery },
        { query: mainServerInfoDataQuery },
        ...(isWorkspacesEnabled.value
          ? [
              {
                query: navigationWorkspaceSwitcherQuery
              }
            ]
          : [])
      ]
    })
  )

  // Preload viewer data
  if (route.meta.key === '/projects/:id/models/resources') {
    // Unable to preload this from vue components due to SSR being essentially turned off for the viewer
    promises.push(
      preload({
        queries: [
          { query: authLoginPanelQuery },
          ...(isWorkspacesEnabled.value
            ? [{ query: authLoginPanelWorkspaceInviteQuery }]
            : [])
        ]
      })
    )
  }

  await Promise.all(promises)
})
