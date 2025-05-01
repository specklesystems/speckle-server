import { defineModuleLoaders } from '@/modules/loaders'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import {
  adminOverrideEnabled,
  getFeatureFlags
} from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'

// TODO: Move everything to use dataLoaders
export default defineModuleLoaders(async () => {
  const getStream = getStreamFactory({ db })

  return {
    getAdminOverrideEnabled: async () => adminOverrideEnabled(),
    getEnv: async () => getFeatureFlags(),
    getProject: async ({ projectId }, { dataLoaders }) => {
      return await dataLoaders.streams.getStream.load(projectId)
    },
    getProjectRole: async ({ userId, projectId }) => {
      const project = await getStream({ streamId: projectId, userId })
      return project?.role || null
    },
    getServerRole: async ({ userId }, { dataLoaders }) => {
      return (await dataLoaders.users.getUser.load(userId))?.role || null
    },
    getProjectRoleCounts: async ({ projectId, role }, { dataLoaders }) => {
      const counts = await dataLoaders.streams.getCollaboratorCounts.load(projectId)
      return counts?.[role] || 0
    },
    getProjectModelCount: async ({ projectId }, { dataLoaders }) => {
      const db = await getProjectDbClient({ projectId })
      return await dataLoaders.forRegion({ db }).streams.getBranchCount.load(projectId)
    },
    getModel: async ({ projectId, modelId }, { dataLoaders }) => {
      const db = await getProjectDbClient({ projectId })
      const model = await dataLoaders.forRegion({ db }).branches.getById.load(modelId)
      if (!model) return null

      return {
        ...model,
        projectId: model.streamId
      }
    },
    getVersion: async ({ projectId, versionId }, { dataLoaders }) => {
      const db = await getProjectDbClient({ projectId })
      const version = await dataLoaders
        .forRegion({ db })
        .commits.getById.load(versionId)
      if (!version) return null

      return {
        ...version,
        projectId,
        authorId: version.author
      }
    }
  }
})
