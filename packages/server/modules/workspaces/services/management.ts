import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import type {
  DeleteWorkspace,
  EmitWorkspaceEvent,
  GetWorkspace,
  StoreWorkspaceDomain,
  UpsertWorkspace,
  UpsertWorkspaceRole,
  GetWorkspaceWithDomains,
  GetWorkspaceDomains,
  UpdateWorkspace,
  GetWorkspaceBySlug,
  AddOrUpdateWorkspaceRole,
  EnsureValidWorkspaceRoleSeat,
  AssignWorkspaceSeat
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceSeatType,
  type Workspace,
  type WorkspaceAcl,
  type WorkspaceDomain,
  type WorkspaceWithDomains
} from '@/modules/workspacesCore/domain/types'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { generateSlugFromName, Roles, validateWorkspaceSlug } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import type {
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
import type { EventBus } from '@/modules/shared/services/eventBus'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { isNewResourceAllowed } from '@/modules/core/helpers/token'
import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { ForbiddenError } from '@/modules/shared/errors'
import { validateImageString } from '@/modules/workspaces/helpers/images'
import type {
  FindEmailsByUserId,
  FindVerifiedEmailsByUserId
} from '@/modules/core/domain/userEmails/operations'
import type { DeleteAllResourceInvites } from '@/modules/serverinvites/domain/operations'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { chunk, isEmpty, omit } from 'lodash-es'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import { workspaceRoles as workspaceRoleDefinitions } from '@/modules/workspaces/roles'
import { blockedDomains } from '@speckle/shared'
import type {
  DeleteSsoProvider,
  GetWorkspaceSsoProviderRecord
} from '@/modules/workspaces/domain/sso/operations'
import type {
  DeleteProjectAndCommits,
  QueryAllProjects
} from '@/modules/core/domain/projects/operations'
import type { CountWorkspaceUsers } from '@/modules/workspacesCore/domain/operations'
import type { GetWorkspacePlansByWorkspaceId } from '@/modules/gatekeeper/domain/billing'

type WorkspaceCreateArgs = {
  userId: string
  workspaceInput: {
    name: string
    slug?: string | null
    description: string | null
    logo: string | null
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
    generateValidSlug,
    validateSlug,
    emitWorkspaceEvent,
    addOrUpdateWorkspaceRole
  }: {
    upsertWorkspace: UpsertWorkspace
    validateSlug: ValidateWorkspaceSlug
    generateValidSlug: GenerateValidSlug
    emitWorkspaceEvent: EventBus['emit']
    addOrUpdateWorkspaceRole: AddOrUpdateWorkspaceRole
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
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false,
      discoverabilityAutoJoinEnabled: false,
      isEmbedSpeckleBrandingHidden: false,
      defaultSeatType: null,
      isExclusive: false
    } satisfies Workspace
    await upsertWorkspace({ workspace })

    // emit a workspace created event
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Created,
      payload: { workspace, createdByUserId: userId }
    })

    // assign the creator as workspace administrator
    await addOrUpdateWorkspaceRole({
      userId,
      workspaceId: workspace.id,
      role: Roles.Workspace.Admin,
      updatedByUserId: userId
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
    getWorkspaceSsoProviderRecord,
    validateSlug,
    upsertWorkspace,
    emitWorkspaceEvent
  }: {
    getWorkspace: GetWorkspaceWithDomains
    getWorkspaceSsoProviderRecord: GetWorkspaceSsoProviderRecord
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

    if (workspaceInput.slug) {
      const ssoProvider = await getWorkspaceSsoProviderRecord({ workspaceId })
      if (ssoProvider)
        throw new WorkspaceInvalidUpdateError(
          'Cannot update workspace slug if SSO is configured.'
        )
      await validateSlug({ slug: workspaceInput.slug })
    }

    const workspace = {
      ...omit(currentWorkspace, 'domains'),
      ...sanitizeInput(workspaceInput),
      updatedAt: new Date()
    }

    await upsertWorkspace({ workspace })
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Updated,
      payload: { workspace }
    })

    return workspace
  }

export const deleteWorkspaceFactory =
  ({
    deleteWorkspace,
    deleteProjectAndCommits,
    queryAllProjects,
    deleteAllResourceInvites,
    deleteSsoProvider,
    emitWorkspaceEvent,
    countWorkspaceUsers,
    getWorkspacePlansByWorkspaceId
  }: {
    deleteWorkspace: (args: { workspaceId: string }) => Promise<void>
    deleteProjectAndCommits: DeleteProjectAndCommits
    queryAllProjects: QueryAllProjects
    deleteAllResourceInvites: DeleteAllResourceInvites
    deleteSsoProvider: DeleteSsoProvider
    countWorkspaceUsers: CountWorkspaceUsers
    getWorkspacePlansByWorkspaceId: GetWorkspacePlansByWorkspaceId
    emitWorkspaceEvent: EventBus['emit']
  }): DeleteWorkspace =>
  async ({ workspaceId, userId }): Promise<void> => {
    // Delete workspace SSO provider, if present
    await deleteSsoProvider({ workspaceId })

    // Cache project ids for post-workspace-delete cleanup
    const projectIds: string[] = []
    for await (const projects of queryAllProjects({ workspaceId })) {
      projectIds.push(...projects.map((project) => project.id))
    }

    const [totalEditorSeats, totalViewerSeats, plans] = await Promise.all([
      countWorkspaceUsers({
        workspaceId,
        filter: { seatType: WorkspaceSeatType.Editor }
      }),
      countWorkspaceUsers({
        workspaceId,
        filter: { seatType: WorkspaceSeatType.Viewer }
      }),
      getWorkspacePlansByWorkspaceId({ workspaceIds: [workspaceId] })
    ])

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
      await Promise.all(
        projectIdsChunk.map((projectId) => deleteProjectAndCommits({ projectId }))
      )
    }
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Deleted,
      payload: {
        workspaceId,
        userId,
        totalEditorSeats,
        totalViewerSeats,
        plan: plans[workspaceId]
      }
    })
  }

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
  deletedByUserId: string
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
    userId,
    deletedByUserId
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
      payload: { acl: deletedRole, updatedByUserId: deletedByUserId }
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

export const addOrUpdateWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    getWorkspaceWithDomains,
    findVerifiedEmailsByUserId,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    ensureValidWorkspaceRoleSeat,
    assignWorkspaceSeat
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    findVerifiedEmailsByUserId: FindVerifiedEmailsByUserId
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    ensureValidWorkspaceRoleSeat: EnsureValidWorkspaceRoleSeat
    assignWorkspaceSeat: AssignWorkspaceSeat
  }): AddOrUpdateWorkspaceRole =>
  async ({
    workspaceId,
    userId,
    role: nextWorkspaceRole,
    preventRoleDowngrade,
    updatedByUserId,
    seatType
  }): Promise<void> => {
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    const previousWorkspaceRole = workspaceRoles.find((acl) => acl.userId === userId)

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

    if (seatType) {
      await assignWorkspaceSeat({
        userId,
        workspaceId,
        type: seatType,
        assignedByUserId: updatedByUserId
      })
    } else {
      await ensureValidWorkspaceRoleSeat({
        userId,
        workspaceId,
        role: nextWorkspaceRole,
        updatedByUserId
      })
    }

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: {
        acl: {
          userId,
          workspaceId,
          role: nextWorkspaceRole
        },
        updatedByUserId
      }
    })
  }

export const addDomainToWorkspaceFactory =
  ({
    findEmailsByUserId,
    storeWorkspaceDomain,
    getWorkspace,
    emitWorkspaceEvent,
    getDomains
  }: {
    findEmailsByUserId: FindEmailsByUserId
    storeWorkspaceDomain: StoreWorkspaceDomain
    getWorkspace: GetWorkspace
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
        userEmail.verified &&
        userEmail.email.toLowerCase().split('@')[1] === sanitizedDomain
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

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Updated,
      payload: { workspace }
    })
  }
