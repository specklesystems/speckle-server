import { db } from '@/db/knex'
import {
  grantStreamPermissions,
  revokeStreamPermissions
} from '@/modules/core/repositories/streams'
import { getStreams } from '@/modules/core/services/streams'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getWorkspaceRolesFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory as dbDeleteWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  createWorkspaceFactory,
  setWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory
} from '@/modules/workspaces/services/management'
import { BasicTestUser } from '@/test/authHelper'
import { MaybeNullOrUndefined, Roles, WorkspaceRoles } from '@speckle/shared'

export type BasicTestWorkspace = {
  /**
   * Leave empty, will be filled on creation
   */
  id: string
  /**
   * Leave empty, will be filled on creation
   */
  ownerId: string
  name: string
  description?: string
  logoUrl?: string
}

export const createTestWorkspace = async (
  workspace: BasicTestWorkspace,
  owner: BasicTestUser
) => {
  const createWorkspace = createWorkspaceFactory({
    upsertWorkspace: upsertWorkspaceFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    storeBlob: () => Promise.resolve(''),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
  })

  const finalWorkspace = await createWorkspace({
    userId: owner.id,
    workspaceInput: {
      name: workspace.name,
      description: workspace.description || null,
      logo: workspace.logoUrl || null
    }
  })

  workspace.id = finalWorkspace.id
  workspace.ownerId = owner.id
}

export const assignToWorkspace = async (
  workspace: BasicTestWorkspace,
  user: BasicTestUser,
  role?: WorkspaceRoles
) => {
  const setWorkspaceRole = setWorkspaceRoleFactory({
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
    getStreams,
    grantStreamPermissions
  })

  await setWorkspaceRole({
    userId: user.id,
    workspaceId: workspace.id,
    role: role || Roles.Workspace.Member
  })
}

export const unassignFromWorkspace = async (
  workspace: BasicTestWorkspace,
  user: BasicTestUser
) => {
  const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    deleteWorkspaceRole: dbDeleteWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
    getStreams,
    revokeStreamPermissions
  })

  await deleteWorkspaceRole({
    userId: user.id,
    workspaceId: workspace.id
  })
}

export const unassignFromWorkspaces = async (
  pairs: [BasicTestWorkspace, BasicTestUser][]
) => {
  await Promise.all(pairs.map((p) => unassignFromWorkspace(p[0], p[1])))
}

export const assignToWorkspaces = async (
  pairs: [BasicTestWorkspace, BasicTestUser, MaybeNullOrUndefined<WorkspaceRoles>][]
) => {
  await Promise.all(pairs.map((p) => assignToWorkspace(p[0], p[1], p[2] || undefined)))
}

export const createTestWorkspaces = async (
  pairs: [BasicTestWorkspace, BasicTestUser][]
) => {
  await Promise.all(pairs.map((p) => createTestWorkspace(p[0], p[1])))
}
