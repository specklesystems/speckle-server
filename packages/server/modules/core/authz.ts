import { getStreamFactory } from '@/modules/core/repositories/streams'
import { defineLoaders } from '@/modules/loaders'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { getUserServerRoleFactory } from '@/modules/shared/repositories/acl'

export const defineModuleLoaders = () => {
  const getStream = getStreamFactory({ db })
  const getUserServerRole = getUserServerRoleFactory({ db })

  defineLoaders({
    getEnv: getFeatureFlags,
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
  })
}
