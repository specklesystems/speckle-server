import { db } from '@/db/knex'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import {
  getProjectRolesFactory,
  getWorkspaceDomainsFactory,
  getWorkspacesFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  WorkspaceDomain,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import { keyBy } from 'lodash'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface AllRequestDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(({ ctx, createLoader }) => {
  const getWorkspaces = getWorkspacesFactory({ db })
  const getWorkspaceDomains = getWorkspaceDomainsFactory({ db })
  const getProjectRoles = getProjectRolesFactory({ db })

  return {
    workspaces: {
      /**
       * Get workspace, with the active user's role attached
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
      getProjectRolesByWorkspaceId: createLoader<
        { workspaceId: string; userId: string },
        (Pick<StreamAclRecord, 'role'> & { project: StreamRecord })[] | null
      >(async (keys) => {
        const workspaceId = keys[0].workspaceId
        const userIds = keys.map(({ userId }) => userId)
        const usersWithRoles = await getProjectRoles({ workspaceId, userIds })
        return userIds.map(
          (id) => usersWithRoles.find(({ userId }) => id === userId)?.projectRoles || []
        )
      })
    },
    workspaceDomains: {
      /**
       * Get workspace, with the active user's role attached
       */
      getWorkspaceDomains: createLoader<string, WorkspaceDomain | null>(async (ids) => {
        const results = keyBy(
          await getWorkspaceDomains({ workspaceIds: ids.slice() }),
          (w) => w.id
        )
        return ids.map((id) => results[id] || null)
      })
    }
  }
})

export default FF_WORKSPACES_MODULE_ENABLED ? dataLoadersDefinition : undefined
