import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import {
  authLoginPanelQuery,
  authLoginPanelWorkspaceInviteQuery
} from '~/lib/auth/graphql/queries'
import { usePreloadApolloQueries } from '~/lib/common/composables/graphql'
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'
import { serverInfoBlobSizeLimitQuery } from '~/lib/common/graphql/queries'
import { mainServerInfoDataQuery } from '~/lib/core/composables/server'
import {
  navigationProjectInvitesQuery,
  navigationWorkspaceInvitesQuery,
  navigationWorkspaceSwitcherQuery
} from '~/lib/navigation/graphql/queries'
import { discoverableWorkspacesQuery } from '~/lib/workspaces/graphql/queries'
import {
  buildActiveUserWorkspaceExistenceCheckQuery,
  buildWorkspaceAccessCheckQuery
} from '~/lib/workspaces/helpers/middleware'

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
        { query: serverInfoBlobSizeLimitQuery },
        { query: navigationProjectInvitesQuery },
        ...(isWorkspacesEnabled.value
          ? [
              {
                query: discoverableWorkspacesQuery
              },
              {
                query: navigationWorkspaceInvitesQuery
              },
              {
                query: navigationWorkspaceSwitcherQuery
              },
              {
                query: navigationWorkspaceSwitcherQuery,
                variables: {
                  joinRequestFilter: {
                    status: WorkspaceJoinRequestStatus.Pending
                  }
                }
              },
              buildActiveUserWorkspaceExistenceCheckQuery()
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

  // Preload workspace access check
  const workspaceSlug = route.params.slug as string
  if (workspaceSlug && isWorkspacesEnabled.value) {
    promises.push(
      preload({
        queries: [buildWorkspaceAccessCheckQuery(workspaceSlug)]
      })
    )
  }

  await Promise.all(promises)
})
