import { db } from '@/db/knex'
import { getStream } from '@/modules/core/repositories/streams'
import {
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory
} from '@/modules/core/repositories/userEmails'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getWorkspaceRolesFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory as dbDeleteWorkspaceRoleFactory,
  getWorkspaceFactory,
  getWorkspaceWithDomainsFactory,
  getWorkspaceDomainsFactory,
  storeWorkspaceDomainFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  buildWorkspaceInviteEmailContentsFactory,
  collectAndValidateWorkspaceTargetsFactory,
  createWorkspaceInviteFactory
} from '@/modules/workspaces/services/invites'
import {
  createWorkspaceFactory,
  updateWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory,
  updateWorkspaceFactory,
  addDomainToWorkspaceFactory
} from '@/modules/workspaces/services/management'
import { BasicTestUser } from '@/test/authHelper'
import { CreateWorkspaceInviteMutationVariables } from '@/test/graphql/generated/graphql'
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
  logo?: string
  discoverabilityEnabled?: boolean
  domainBasedMembershipProtectionEnabled?: boolean
}

export const createTestWorkspace = async (
  workspace: BasicTestWorkspace,
  owner: BasicTestUser,
  domain?: string
) => {
  const createWorkspace = createWorkspaceFactory({
    upsertWorkspace: upsertWorkspaceFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
  })

  const newWorkspace = await createWorkspace({
    userId: owner.id,
    workspaceInput: {
      name: workspace.name,
      description: workspace.description || null,
      logo: workspace.logo || null,
      defaultLogoIndex: 0
    },
    userResourceAccessLimits: null
  })

  workspace.id = newWorkspace.id
  if (domain) {
    await addDomainToWorkspaceFactory({
      findEmailsByUserId: findEmailsByUserIdFactory({ db }),
      storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
      getWorkspace: getWorkspaceFactory({ db }),
      upsertWorkspace: upsertWorkspaceFactory({ db }),
      emitWorkspaceEvent: getEventBus().emit,
      getDomains: getWorkspaceDomainsFactory({ db })
    })({
      userId: owner.id,
      workspaceId: workspace.id,
      domain
    })
  }

  if (workspace.discoverabilityEnabled) {
    if (!domain) throw new Error('Domain is needed for discoverability')
    const updateWorkspace = updateWorkspaceFactory({
      getWorkspace: getWorkspaceWithDomainsFactory({ db }),
      upsertWorkspace: upsertWorkspaceFactory({ db }),
      emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
    })

    await updateWorkspace({
      workspaceId: newWorkspace.id,
      workspaceInput: {
        discoverabilityEnabled: true
      }
    })
  }

  if (workspace.domainBasedMembershipProtectionEnabled) {
    if (!domain) throw new Error('Domain is needed for membership protection')
    await updateWorkspaceFactory({
      getWorkspace: getWorkspaceWithDomainsFactory({ db }),
      upsertWorkspace: upsertWorkspaceFactory({ db }),
      emitWorkspaceEvent: getEventBus().emit
    })({
      workspaceId: newWorkspace.id,
      workspaceInput: { domainBasedMembershipProtectionEnabled: true }
    })
  }

  workspace.ownerId = owner.id
}

export const assignToWorkspace = async (
  workspace: BasicTestWorkspace,
  user: BasicTestUser,
  role?: WorkspaceRoles
) => {
  const updateWorkspaceRole = updateWorkspaceRoleFactory({
    getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
  })

  await updateWorkspaceRole({
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
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
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
  pairs: [BasicTestWorkspace, BasicTestUser, string?][]
) => {
  await Promise.all(pairs.map((p) => createTestWorkspace(p[0], p[1], p[2])))
}

export const createWorkspaceInviteDirectly = async (
  args: CreateWorkspaceInviteMutationVariables,
  inviterId: string
) => {
  const createAndSendInvite = createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory(),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: collectAndValidateWorkspaceTargetsFactory({
      getStream,
      getWorkspace: getWorkspaceFactory({ db }),
      getWorkspaceDomains: getWorkspaceDomainsFactory({ db }),
      findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db })
    }),
    buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
      getStream,
      getWorkspace: getWorkspaceFactory({ db })
    }),
    emitEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      })
  })

  const createInvite = createWorkspaceInviteFactory({
    createAndSendInvite
  })

  return await createInvite({
    ...args,
    inviterId,
    inviterResourceAccessRules: null
  })
}
