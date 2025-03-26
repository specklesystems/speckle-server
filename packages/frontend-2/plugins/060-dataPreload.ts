import type { Optional } from '@speckle/shared'
import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import {
  authLoginPanelQuery,
  authLoginPanelWorkspaceInviteQuery
} from '~/lib/auth/graphql/queries'
import { usePreloadApolloQueries } from '~/lib/common/composables/graphql'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import { projectAccessCheckQuery } from '~/lib/projects/graphql/queries'
import { workspaceAccessCheckQuery } from '~/lib/workspaces/graphql/queries'

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

  const path = route.path
  const idParam = route.params.id as Optional<string>
  const slugParam = route.params.slug as Optional<string>
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

  // Preload workspace data
  if (slugParam && path.startsWith('/workspaces/') && isWorkspacesEnabled.value) {
    promises.push(
      preload({
        queries: [
          {
            query: workspaceAccessCheckQuery,
            variables: { slug: slugParam },
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
