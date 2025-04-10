import { defineModuleLoaders } from '@/modules/loaders'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import {
  adminOverrideEnabled,
  getFeatureFlags
} from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'

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
    }
  }
})
