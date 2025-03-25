import { db } from '@/db/knex'
import { defineModuleLoaders } from '@/modules/loaders'
import {
  getUserSsoSessionFactory,
  getWorkspaceSsoProviderRecordFactory
} from '@/modules/workspaces/repositories/sso'
import {
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory
} from '@/modules/workspaces/repositories/workspaces'

export default defineModuleLoaders(() => {
  return {
    getWorkspace: getWorkspaceFactory({ db }),
    getWorkspaceRole: async ({ userId, workspaceId }) => {
      const role = await getWorkspaceRoleForUserFactory({ db })({
        userId,
        workspaceId
      })
      return role?.role ?? null
    },
    getWorkspaceSsoSession: async ({ userId, workspaceId }) => {
      const ssoSession = await getUserSsoSessionFactory({ db })({
        userId,
        workspaceId
      })
      return ssoSession ?? null
    },
    getWorkspaceSsoProvider: async ({ workspaceId }) => {
      const ssoProvider = await getWorkspaceSsoProviderRecordFactory({ db })({
        workspaceId
      })
      return ssoProvider ?? null
    }
  }
})
