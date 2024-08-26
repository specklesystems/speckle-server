import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import {
  DeleteWorkspace,
  EmitWorkspaceEvent,
  GetWorkspace,
  StoreWorkspaceDomain,
  QueryAllWorkspaceProjects,
  UpsertWorkspace,
  UpsertWorkspaceRole,
  GetWorkspaceWithDomains,
  GetWorkspaceDomains
} from '@/modules/workspaces/domain/operations'
import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain
} from '@/modules/workspacesCore/domain/types'
import { MaybeNullOrUndefined, Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import {
  deleteStream,
  grantStreamPermissions as repoGrantStreamPermissions,
  revokeStreamPermissions as repoRevokeStreamPermissions
} from '@/modules/core/repositories/streams'
import { getStreams as serviceGetStreams } from '@/modules/core/services/streams'
import {
  DeleteWorkspaceRole,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceAdminRequiredError,
  WorkspaceDomainBlockedError,
  WorkspaceNotFoundError,
  WorkspaceProtectedError,
  WorkspaceUnverifiedDomainError,
  WorkspaceInvalidDescriptionError
} from '@/modules/workspaces/errors/workspace'
import {
  isUserLastWorkspaceAdmin,
  mapWorkspaceRoleToProjectRole
} from '@/modules/workspaces/helpers/roles'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { EventBus } from '@/modules/shared/services/eventBus'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { isNewResourceAllowed } from '@/modules/core/helpers/token'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/domain/tokens/types'
import { ForbiddenError } from '@/modules/shared/errors'
import { validateImageString } from '@/modules/workspaces/helpers/images'
import {
  FindEmailsByUserId,
  FindVerifiedEmailsByUserId
} from '@/modules/core/domain/userEmails/operations'
import { blockedDomains } from '@/modules/workspaces/helpers/blockedDomains'
import { DeleteAllResourceInvites } from '@/modules/serverinvites/domain/operations'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { chunk, isEmpty } from 'lodash'
import { db } from '@/db/knex'

type WorkspaceCreateArgs = {
  userId: string
  workspaceInput: {
    name: string
    description: string | null
    logo: string | null
    defaultLogoIndex: number
  }
  userResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
}

export const createWorkspaceFactory =
  ({
    upsertWorkspace,
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    upsertWorkspace: UpsertWorkspace
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EventBus['emit']
  }) =>
  async ({
    userId,
    workspaceInput,
    userResourceAccessLimits
  }: WorkspaceCreateArgs): Promise<Workspace> => {
    if (
      !isNewResourceAllowed({
        resourceType: TokenResourceIdentifierType.Workspace,
        resourceAccessRules: userResourceAccessLimits
      })
    ) {
      throw new ForbiddenError('You are not authorized to create a workspace')
    }

    const workspace = {
      ...workspaceInput,
      id: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false
    }
    await upsertWorkspace({ workspace })
    // assign the creator as workspace administrator
    await upsertWorkspaceRole({
      userId,
      role: Roles.Workspace.Admin,
      workspaceId: workspace.id
    })

    // emit a workspace created event
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Created,
      payload: { ...workspace, createdByUserId: userId }
    })

    return { ...workspace }
  }

type WorkspaceUpdateArgs = {
  workspaceId: string
  workspaceInput: {
    name?: string | null
    description?: string | null
    logo?: string | null
    defaultLogoIndex?: number | null
    discoverabilityEnabled?: boolean | null
    domainBasedMembershipProtectionEnabled?: boolean | null
  }
}

export const updateWorkspaceFactory =
  ({
    getWorkspace,
    upsertWorkspace,
    emitWorkspaceEvent
  }: {
    getWorkspace: GetWorkspace
    upsertWorkspace: UpsertWorkspace
    emitWorkspaceEvent: EventBus['emit']
  }) =>
  async ({ workspaceId, workspaceInput }: WorkspaceUpdateArgs): Promise<Workspace> => {
    // Get existing workspace to merge with incoming changes
    const currentWorkspace = await getWorkspace({ workspaceId })
    if (!currentWorkspace) {
      throw new WorkspaceNotFoundError()
    }

    // Validate incoming changes
    if (!!workspaceInput.logo) {
      validateImageString(workspaceInput.logo)
    }
    if (isEmpty(workspaceInput.name)) {
      // Do not allow setting an empty name (empty descriptions allowed)
      delete workspaceInput.name
    }
    if (!!workspaceInput.description && workspaceInput.description.length > 512) {
      throw new WorkspaceInvalidDescriptionError()
    }

    const workspace = {
      ...currentWorkspace,
      ...removeNullOrUndefinedKeys(workspaceInput),
      updatedAt: new Date()
    }

    await upsertWorkspace({ workspace })
    await emitWorkspaceEvent({ eventName: WorkspaceEvents.Updated, payload: workspace })

    return workspace
  }

type WorkspaceDeleteArgs = {
  workspaceId: string
}

export const deleteWorkspaceFactory =
  ({
    deleteWorkspace,
    deleteProject,
    queryAllWorkspaceProjects,
    deleteAllResourceInvites
  }: {
    deleteWorkspace: DeleteWorkspace
    deleteProject: typeof deleteStream
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteAllResourceInvites: DeleteAllResourceInvites
  }) =>
  async ({ workspaceId }: WorkspaceDeleteArgs): Promise<void> => {
    // Cache project ids for post-workspace-delete cleanup
    const projectIds: string[] = []
    for await (const projects of queryAllWorkspaceProjects({ workspaceId })) {
      projectIds.push(...projects.map((project) => project.id))
    }

    await Promise.all([
      deleteWorkspace({ workspaceId }),
      deleteAllResourceInvites({
        resourceId: workspaceId,
        resourceType: WorkspaceInviteResourceType
      }),
      ...projectIds.map((projectId) =>
        deleteAllResourceInvites({
          resourceId: projectId,
          resourceType: ProjectInviteResourceType
        })
      )
    ])

    // Workspace delete cascades-deletes stream table rows, but some manual cleanup is required
    // We re-use `deleteStream` (and re-delete the project) to DRY this manual cleanup
    for (const projectIdsChunk of chunk(projectIds, 25)) {
      await Promise.all(projectIdsChunk.map((projectId) => deleteProject(projectId)))
    }
  }

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    deleteWorkspaceRole,
    emitWorkspaceEvent,
    getStreams,
    revokeStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    getStreams: typeof serviceGetStreams
    revokeStreamPermissions: typeof repoRevokeStreamPermissions
  }) =>
  async ({
    workspaceId,
    userId
  }: WorkspaceRoleDeleteArgs): Promise<WorkspaceAcl | null> => {
    // Protect against removing last admin
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    if (isUserLastWorkspaceAdmin(workspaceRoles, userId)) {
      throw new WorkspaceAdminRequiredError()
    }

    const trx = await db.transaction()

    try {
      // Perform delete
      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId }, { trx })
      if (!deletedRole) {
        // await trx.commit()
        return null
      }

      // Delete workspace project roles
      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams
      })
      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        await Promise.all(
          projectsPage.map(({ id: streamId }) =>
            revokeStreamPermissions({ streamId, userId }, { trx })
          )
        )
      }

      // Emit deleted role
      await emitWorkspaceEvent({
        eventName: WorkspaceEvents.RoleDeleted,
        payload: deletedRole
      })

      return deletedRole
    } catch (e) {
      await trx.rollback()
      throw e
    } finally {
      if (!trx.isCompleted()) {
        await trx.commit()
      }
    }
  }

type WorkspaceRoleGetArgs = {
  userId: string
  workspaceId: string
}

export const getWorkspaceRoleFactory =
  ({ getWorkspaceRoleForUser }: { getWorkspaceRoleForUser: GetWorkspaceRoleForUser }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleGetArgs): Promise<WorkspaceAcl | null> => {
    return await getWorkspaceRoleForUser({ userId, workspaceId })
  }

export const updateWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    getWorkspaceWithDomains,
    findVerifiedEmailsByUserId,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    getStreams,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    findVerifiedEmailsByUserId: FindVerifiedEmailsByUserId
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    // TODO: Create `core` domain and import type from there
    getStreams: typeof serviceGetStreams
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
  async ({
    workspaceId,
    userId,
    role,
    skipProjectRoleUpdatesFor
  }: WorkspaceAcl & {
    /**
     * If this gets triggered from a project role update, we don't want to override that project's role to the default one
     */
    skipProjectRoleUpdatesFor?: string[]
  }): Promise<void> => {
    // Protect against removing last admin
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      role !== Roles.Workspace.Admin
    ) {
      throw new WorkspaceAdminRequiredError()
    }

    const trx = await db.transaction()
    if (role !== Roles.Workspace.Guest) {
      const workspace = await getWorkspaceWithDomains({ id: workspaceId })
      const verifiedDomains = workspace?.domains.filter((domain) => domain?.verified)
      if (
        workspace &&
        verifiedDomains &&
        workspace?.domainBasedMembershipProtectionEnabled &&
        verifiedDomains.length > 0
      ) {
        const domains = new Set<string>(verifiedDomains.map((vd) => vd.domain))
        const verifiedUserEmails = await findVerifiedEmailsByUserId({ userId })
        const domainMatching = verifiedUserEmails.find((userEmail) =>
          domains.has(userEmail.email.split('@')[1])
        )
        if (!domainMatching) {
          throw new WorkspaceProtectedError()
        }
      }
    }

    // Perform upsert
    await upsertWorkspaceRole({ userId, workspaceId, role })

    try {
      // Perform upsert
      await upsertWorkspaceRole({ userId, workspaceId, role }, { trx })

      // Emit new role
      await emitWorkspaceEvent({
        eventName: WorkspaceEvents.RoleUpdated,
        payload: { userId, workspaceId, role }
      })

      // Apply initial project role to existing workspace projects
      const isFirstWorkspaceRole = !workspaceRoles.some(
        (role) => role.userId === userId
      )

      if (!isFirstWorkspaceRole || role === Roles.Workspace.Guest) {
        // Guests do not get roles for existing workspace projects
        return
      }

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams
      })
      const projectRole = mapWorkspaceRoleToProjectRole(role)
      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        await Promise.all(
          projectsPage.map(({ id: streamId }) => {
            if (skipProjectRoleUpdatesFor?.includes(streamId)) {
              return
            }

            return grantStreamPermissions(
              { streamId, userId, role: projectRole },
              { trx }
            )
          })
        )
      }
    } catch (e) {
      await trx.rollback()
      throw e
    } finally {
      if (!trx.isCompleted()) {
        await trx.commit()
      }
    }
  }

export const addDomainToWorkspaceFactory =
  ({
    findEmailsByUserId,
    storeWorkspaceDomain,
    getWorkspace,
    upsertWorkspace,
    emitWorkspaceEvent,
    getDomains
  }: {
    findEmailsByUserId: FindEmailsByUserId
    storeWorkspaceDomain: StoreWorkspaceDomain
    getWorkspace: GetWorkspace
    upsertWorkspace: UpsertWorkspace
    getDomains: GetWorkspaceDomains
    emitWorkspaceEvent: EventBus['emit']
  }) =>
  async ({
    userId,
    domain,
    workspaceId
  }: {
    userId: string
    domain: string
    workspaceId: string
  }) => {
    // this function makes the assumption, that the user has a workspace admin role
    const sanitizedDomain = domain.toLowerCase().trim()
    if (blockedDomains.includes(sanitizedDomain))
      throw new WorkspaceDomainBlockedError()
    const userEmails = await findEmailsByUserId({
      userId
    })

    const email = userEmails.find(
      (userEmail) =>
        userEmail.verified && userEmail.email.split('@')[1] === sanitizedDomain
    )

    if (!email) {
      throw new WorkspaceUnverifiedDomainError()
    }
    // we're treating all user owned domains as verified, cause they have it in their verified emails list
    const verified = true

    const workspaceWithRole = await getWorkspace({ workspaceId, userId })

    if (!workspaceWithRole) throw new WorkspaceAdminRequiredError()

    const { role, ...workspace } = workspaceWithRole

    if (role !== Roles.Workspace.Admin) {
      throw new WorkspaceAdminRequiredError()
    }

    const domains = await getDomains({ workspaceIds: [workspaceId] })

    // idempotent operation
    if (domains.find((domain) => domain.domain === sanitizedDomain)) return

    const workspaceDomain: WorkspaceDomain = {
      workspaceId,
      id: cryptoRandomString({ length: 10 }),
      domain: sanitizedDomain,
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified
    }

    await storeWorkspaceDomain({ workspaceDomain })

    if (domains.length === 0) {
      await upsertWorkspace({
        workspace: { ...workspace, discoverabilityEnabled: true }
      })
    }

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Updated,
      payload: workspace
    })
  }
