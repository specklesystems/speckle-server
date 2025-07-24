import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import {
  getWorkspaceDomainsFactory,
  getWorkspacesBySlugFactory,
  getWorkspacesFactory,
  getWorkspacesProjectsCountsFactory,
  getWorkspacesRolesForUsersFactory
} from '@/modules/workspaces/repositories/workspaces'
import type {
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import { keyBy } from 'lodash-es'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ ctx, createLoader, deps: { db } }) => {
    const getWorkspaces = getWorkspacesFactory({ db })
    const getWorkspacesBySlug = getWorkspacesBySlugFactory({ db })
    const getWorkspaceDomains = getWorkspaceDomainsFactory({ db })
    const getWorkspacesProjectsCounts = getWorkspacesProjectsCountsFactory({ db })
    const getWorkspacesRolesForUsers = getWorkspacesRolesForUsersFactory({ db })

    return {
      workspaces: {
        /**
         * Get workspace by id, with the active user's role attached
         */
        getWorkspace: createLoader<string, WorkspaceWithOptionalRole | null>(
          async (ids) => {
            const results = keyBy(
              await getWorkspaces({ workspaceIds: ids.slice(), userId: ctx.userId }),
              (w) => w.id
            )
            return ids.map((id) => results[id] || null)
          }
        ),
        /**
         * Get workspace by slug, with the active user's role attached
         */
        getWorkspaceBySlug: createLoader<string, WorkspaceWithOptionalRole | null>(
          async (slugs) => {
            const results = keyBy(
              await getWorkspacesBySlug({
                workspaceSlugs: slugs.slice(),
                userId: ctx.userId
              }),
              (w) => w.slug
            )
            return slugs.map((id) => results[id] || null)
          }
        ),
        /**
         * Get workspace project count
         */
        getProjectCount: createLoader<string, number | null>(async (ids) => {
          const results = await getWorkspacesProjectsCounts({
            workspaceIds: ids.slice()
          })
          return ids.map((id) => results[id])
        }),
        /**
         * Get workspace role
         */
        getWorkspaceRole: createLoader<
          { userId: string; workspaceId: string },
          WorkspaceAcl | null,
          string
        >(
          async (idPairs) => {
            const results = await getWorkspacesRolesForUsers(idPairs.slice())
            return idPairs.map(({ userId, workspaceId }) => {
              return results[workspaceId]?.[userId] || null
            })
          },
          {
            cacheKeyFn: (args) => `${args.userId}-${args.workspaceId}`
          }
        )
      },
      workspaceDomains: {
        /**
         * Get workspace, with the active user's role attached
         */
        getWorkspaceDomains: createLoader<string, WorkspaceDomain | null>(
          async (ids) => {
            const results = keyBy(
              await getWorkspaceDomains({ workspaceIds: ids.slice() }),
              (w) => w.id
            )
            return ids.map((id) => results[id] || null)
          }
        )
      }
    }
  }
)

export default FF_WORKSPACES_MODULE_ENABLED ? dataLoadersDefinition : undefined
