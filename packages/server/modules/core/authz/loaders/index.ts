import { defineModuleLoaders } from '@/modules/loaders'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { getUserServerRoleFactory } from '@/modules/shared/repositories/acl'

export default defineModuleLoaders(async () => {
  const getStream = getStreamFactory({ db })
  const getUserServerRole = getUserServerRoleFactory({ db })

  return {
    getEnv: async () => getFeatureFlags(),
    getProject: async ({ projectId }) => {
      const project = await getStream({ streamId: projectId })
      if (!project) return null
      return { ...project, projectId: project.id }
    },
    getProjectRole: async ({ userId, projectId }) => {
      const project = await getStream({ streamId: projectId, userId })
      return project?.role ?? null
    },
    getServerRole: async ({ userId }) => {
      const role = await getUserServerRole({ userId })
      return role ?? null
    }
  }
})
