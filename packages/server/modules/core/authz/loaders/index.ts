import { defineModuleLoaders } from '@/modules/loaders'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { db } from '@/db/knex'
import { getUserServerRoleFactory } from '@/modules/shared/repositories/acl'
import { err, ok } from 'true-myth/result'
import { Authz } from '@speckle/shared'

export default defineModuleLoaders(async () => {
  const getStream = getStreamFactory({ db })
  const getUserServerRole = getUserServerRoleFactory({ db })

  return {
    getEnv: async () => getFeatureFlags(),
    getProject: async ({ projectId }) => {
      const project = await getStream({ streamId: projectId })
      if (!project) return err(Authz.ProjectNotFoundError)
      return ok({ ...project, projectId: project.id })
    },
    getProjectRole: async ({ userId, projectId }) => {
      const project = await getStream({ streamId: projectId, userId })
      if (!project?.role) return err(Authz.ProjectRoleNotFoundError)
      return ok(project.role)
    },
    getServerRole: async ({ userId }) => {
      const role = await getUserServerRole({ userId })
      if (!role) return err(Authz.ServerRoleNotFoundError)
      return ok(role)
    }
  }
})
