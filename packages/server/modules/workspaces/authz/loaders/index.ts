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
import { Authz } from '@speckle/shared'
import { err, ok } from 'true-myth/result'

export default defineModuleLoaders(async () => {
  const getWorkspace = getWorkspaceFactory({ db })
  return {
    getWorkspace: async ({ workspaceId }) => {
      const workspace = await getWorkspace({ workspaceId })
      if (!workspace) return err(Authz.WorkspaceNotFoundError)
      return ok(workspace)
    },
    getWorkspaceRole: async ({ userId, workspaceId }) => {
      const role = await getWorkspaceRoleForUserFactory({ db })({
        userId,
        workspaceId
      })
      if (!role) return err(Authz.WorkspaceRoleNotFoundError)
      return ok(role.role)
    },
    getWorkspaceSsoSession: async ({ userId, workspaceId }) => {
      const ssoSession = await getUserSsoSessionFactory({ db })({
        userId,
        workspaceId
      })
      if (!ssoSession) return err(Authz.WorkspaceSsoSessionNotFoundError)
      return ok(ssoSession)
    },
    getWorkspaceSsoProvider: async ({ workspaceId }) => {
      const ssoProvider = await getWorkspaceSsoProviderRecordFactory({ db })({
        workspaceId
      })
      if (!ssoProvider) return err(Authz.WorkspaceSsoProviderNotFoundError)
      return ok(ssoProvider)
    }
  }
})
