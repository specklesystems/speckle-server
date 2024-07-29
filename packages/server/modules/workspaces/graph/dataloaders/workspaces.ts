import { db } from '@/db/knex'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import { getWorkspacesFactory } from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceWithOptionalRole } from '@/modules/workspacesCore/domain/types'
import { keyBy } from 'lodash'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface AllRequestDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(({ ctx, createLoader }) => {
  const getWorkspaces = getWorkspacesFactory({ db })

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
      )
    }
  }
})

export default FF_WORKSPACES_MODULE_ENABLED ? dataLoadersDefinition : undefined
