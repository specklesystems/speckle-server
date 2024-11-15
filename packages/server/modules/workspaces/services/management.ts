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
  GetWorkspaceDomains,
  UpdateWorkspace,
  GetWorkspaceBySlug,
  UpdateWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithDomains
} from '@/modules/workspacesCore/domain/types'
import {
  generateSlugFromName,
  MaybeNullOrUndefined,
  Roles,
  validateWorkspaceSlug
} from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
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
  WorkspaceNoVerifiedDomainsError,
  WorkspaceSlugTakenError,
  WorkspaceSlugInvalidError,
  WorkspaceInvalidUpdateError
} from '@/modules/workspaces/errors/workspace'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/helpers/roles'
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
import { DeleteAllResourceInvites } from '@/modules/serverinvites/domain/operations'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { chunk, isEmpty, omit } from 'lodash'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import { workspaceRoles as workspaceRoleDefinitions } from '@/modules/workspaces/roles'
import { blockedDomains } from '@speckle/shared'
import { DeleteStreamRecord } from '@/modules/core/domain/streams/operations'
import { DeleteSsoProvider } from '@/modules/workspaces/domain/sso/operations'

type WorkspaceCreateArgs = {
  userId: string
  workspaceInput: {
    name: string
    slug?: string | null
    description: string | null
    logo: string | null
    defaultLogoIndex: number
  }
  userResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
}

type GenerateValidSlug = (args: { name: string }) => Promise<string>

type ValidateWorkspaceSlug = (args: { slug: string }) => Promise<void>

export const validateSlugFactory =
  ({
    getWorkspaceBySlug
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
  }): ValidateWorkspaceSlug =>
  async ({ slug }) => {
    try {
      validateWorkspaceSlug(slug)
    } catch (err) {
      if (err instanceof Error) throw new WorkspaceSlugInvalidError(err.message)
      throw err
    }
    const maybeClashingWorkspace = await getWorkspaceBySlug({
      workspaceSlug: slug
    })
    if (maybeClashingWorkspace) throw new WorkspaceSlugTakenError()
  }

export const generateValidSlugFactory =
  ({
    getWorkspaceBySlug
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
  }): GenerateValidSlug =>
  async ({ name }) => {
    const generatedSlug = generateSlugFromName({ name })

    const maybeClashingWorkspace = await getWorkspaceBySlug({
      workspaceSlug: generatedSlug
    })
    return maybeClashingWorkspace
      ? `${generatedSlug}-${cryptoRandomString({ length: 5 })}`
      : generatedSlug
  }

export const createWorkspaceFactory =
  ({
    upsertWorkspace,
    upsertWorkspaceRole,
    generateValidSlug,
    validateSlug,
    emitWorkspaceEvent
  }: {
    upsertWorkspace: UpsertWorkspace
    upsertWorkspaceRole: UpsertWorkspaceRole
    validateSlug: ValidateWorkspaceSlug
    generateValidSlug: GenerateValidSlug
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

    let slug: string
    if (workspaceInput.slug) {
      await validateSlug({ slug: workspaceInput.slug })
      slug = workspaceInput.slug
    } else {
      slug = await generateValidSlug(workspaceInput)
    }
    const workspace = {
      ...workspaceInput,
      slug,
      id: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      defaultProjectRole: Roles.Stream.Contributor,
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false
    }
    await upsertWorkspace({ workspace })
    // assign the creator as workspace administrator
    await upsertWorkspaceRole({
      userId,
      role: Roles.Workspace.Admin,
      workspaceId: workspace.id,
      createdAt: new Date()
    })

    // emit a workspace created event
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Created,
      payload: { ...workspace, createdByUserId: userId }
    })

    return { ...workspace }
  }

type WorkspaceUpdateInput = Parameters<UpdateWorkspace>[0]['workspaceInput']

const isValidInput = (input: WorkspaceUpdateInput): input is Partial<Workspace> => {
  if (!!input.logo) {
    validateImageString(input.logo)
  }

  if (!!input.description) {
    if (input.description.length > 512)
      throw new WorkspaceInvalidUpdateError('Provided description is too long')
  }

  return true
}

const isValidWorkspace = (
  input: WorkspaceUpdateInput,
  workspace: WorkspaceWithDomains
): boolean => {
  const hasVerifiedDomains = workspace.domains.find((domain) => domain.verified)

  if (input.discoverabilityEnabled && !workspace.discoverabilityEnabled) {
    if (!hasVerifiedDomains) throw new WorkspaceNoVerifiedDomainsError()
  }

  if (
    input.domainBasedMembershipProtectionEnabled &&
    !workspace.domainBasedMembershipProtectionEnabled
  ) {
    if (!hasVerifiedDomains) throw new WorkspaceNoVerifiedDomainsError()
  }

  return true
}

const sanitizeInput = (input: Partial<Workspace>) => {
  const sanitizedInput = structuredClone(input)

  if (isEmpty(sanitizedInput.name)) {
    // Do not allow setting an empty name (empty descriptions allowed)
    delete sanitizedInput.name
  }

  return removeNullOrUndefinedKeys(sanitizedInput)
}

export const updateWorkspaceFactory =
  ({
    getWorkspace,
    validateSlug,
    upsertWorkspace,
    emitWorkspaceEvent
  }: {
    getWorkspace: GetWorkspaceWithDomains
    validateSlug: ValidateWorkspaceSlug
    upsertWorkspace: UpsertWorkspace
    emitWorkspaceEvent: EventBus['emit']
  }): UpdateWorkspace =>
  async ({ workspaceId, workspaceInput }) => {
    // Get existing workspace to merge with incoming changes
    const currentWorkspace = await getWorkspace({ id: workspaceId })
    if (!currentWorkspace) {
      throw new WorkspaceNotFoundError()
    }

    if (
      !isValidInput(workspaceInput) ||
      !isValidWorkspace(workspaceInput, currentWorkspace)
    ) {
      throw new WorkspaceInvalidUpdateError()
    }

    if (workspaceInput.slug) await validateSlug({ slug: workspaceInput.slug })

    const workspace = {
      ...omit(currentWorkspace, 'domains'),
      ...sanitizeInput(workspaceInput),
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
    deleteAllResourceInvites,
    deleteSsoProvider
  }: {
    deleteWorkspace: DeleteWorkspace
    deleteProject: DeleteStreamRecord
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteAllResourceInvites: DeleteAllResourceInvites
    deleteSsoProvider: DeleteSsoProvider
  }) =>
  async ({ workspaceId }: WorkspaceDeleteArgs): Promise<void> => {
    // Delete workspace SSO provider, if present
    await deleteSsoProvider({ workspaceId })

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
    emitWorkspaceEvent
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
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

    // Perform delete
    const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })
    if (!deletedRole) {
      return null
    }

    // Emit deleted role
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleDeleted,
      payload: deletedRole
    })

    return deletedRole
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
    emitWorkspaceEvent
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    findVerifiedEmailsByUserId: FindVerifiedEmailsByUserId
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }): UpdateWorkspaceRole =>
  async ({
    workspaceId,
    userId,
    role: nextWorkspaceRole,
    skipProjectRoleUpdatesFor,
    preventRoleDowngrade
  }): Promise<void> => {
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })

    // Return early if no work required
    const previousWorkspaceRole = workspaceRoles.find((acl) => acl.userId === userId)
    if (previousWorkspaceRole?.role === nextWorkspaceRole) {
      return
    }

    // prevent role downgrades (used during invite flow)
    if (preventRoleDowngrade) {
      if (previousWorkspaceRole) {
        const roleWeights = workspaceRoleDefinitions
        const existingRoleWeight = roleWeights.find(
          (w) => w.name === previousWorkspaceRole.role
        )!.weight
        const newRoleWeight = roleWeights.find(
          (w) => w.name === nextWorkspaceRole
        )!.weight
        if (newRoleWeight < existingRoleWeight) return
      }
    }

    // Protect against removing last admin
    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      nextWorkspaceRole !== Roles.Workspace.Admin
    ) {
      throw new WorkspaceAdminRequiredError()
    }

    // ensure domain compliance
    if (nextWorkspaceRole !== Roles.Workspace.Guest) {
      const workspace = await getWorkspaceWithDomains({ id: workspaceId })
      if (!workspace) throw new WorkspaceNotFoundError()
      if (workspace.domainBasedMembershipProtectionEnabled) {
        const userEmails = await findVerifiedEmailsByUserId({ userId })
        if (
          !userEmailsCompliantWithWorkspaceDomains({
            userEmails,
            workspaceDomains: workspace.domains
          })
        ) {
          throw new WorkspaceProtectedError()
        }
      }
    }

    // Perform and emit change
    await upsertWorkspaceRole({
      userId,
      workspaceId,
      role: nextWorkspaceRole,
      createdAt: previousWorkspaceRole?.createdAt ?? new Date()
    })

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: {
        userId,
        workspaceId,
        role: nextWorkspaceRole,
        flags: {
          skipProjectRoleUpdatesFor: skipProjectRoleUpdatesFor ?? []
        }
      }
    })
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
