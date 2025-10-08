import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import type {
  PendingWorkspaceCollaboratorsFilter,
  WorkspaceInviteCreateInput
} from '@/modules/core/graph/generated/graphql'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { mapServerRoleToValue } from '@/modules/core/helpers/graphTypes'
import { getWorkspaceRoute } from '@/modules/core/helpers/routeHelper'
import { isResourceAllowed } from '@/modules/core/helpers/token'
import type { UserRecord } from '@/modules/core/helpers/types'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import type {
  FindInvite,
  QueryAllResourceInvites,
  QueryAllUserResourceInvites
} from '@/modules/serverinvites/domain/operations'
import type {
  ExtendedInvite,
  InviteResourceTarget,
  PrimaryInviteResourceTarget,
  ProjectInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import {
  InviteCreateValidationError,
  InviteFinalizingError,
  InviteNotFoundError
} from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  isPrimaryResourceTarget,
  isProjectResourceTarget,
  resolveInviteTargetTitle,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import type { BuildInviteContentsFactoryDeps } from '@/modules/serverinvites/services/coreEmailContents'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import type { CollectAndValidateCoreTargetsFactoryDeps } from '@/modules/serverinvites/services/coreResourceCollection'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import type {
  BuildInviteEmailContents,
  CollectAndValidateResourceTargets,
  CreateAndSendInvite,
  GetInvitationTargetUsers,
  ProcessFinalizedResourceInvite,
  ValidateResourceInviteBeforeFinalization
} from '@/modules/serverinvites/services/operations'
import { InviteFinalizationAction } from '@/modules/serverinvites/services/operations'
import { authorizeResolver } from '@/modules/shared'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import type {
  GetWorkspace,
  GetWorkspaceBySlug,
  GetWorkspaceDomains,
  ValidateWorkspaceMemberProjectRole
} from '@/modules/workspaces/domain/operations'
import type { WorkspaceInviteResourceTarget } from '@/modules/workspaces/domain/types'
import { mapGqlWorkspaceRoleToMainRole } from '@/modules/workspaces/helpers/roles'
import type { addOrUpdateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import type { PendingWorkspaceCollaboratorGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { WorkspaceProtectedError } from '@/modules/workspaces/errors/workspace'
import type { FindVerifiedEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  anyEmailCompliantWithWorkspaceDomains,
  userEmailsCompliantWithWorkspaceDomains
} from '@/modules/workspaces/domain/logic'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { GetUser } from '@/modules/core/domain/users/operations'
import type { GetWorkspaceRoleAndSeat } from '@/modules/workspacesCore/domain/operations'
import { LogicError } from '@/modules/shared/errors'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'

export const isWorkspaceResourceTarget = (
  target: InviteResourceTarget
): target is WorkspaceInviteResourceTarget =>
  target.resourceType === WorkspaceInviteResourceType

export const createWorkspaceInviteFactory =
  (deps: { createAndSendInvite: CreateAndSendInvite }) =>
  async (params: {
    workspaceId: string
    inviterId: string
    input: WorkspaceInviteCreateInput
    inviterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }) => {
    const { workspaceId, inviterId, input, inviterResourceAccessRules } = params

    if (!input.email?.length && !input.userId?.length) {
      throw new InviteCreateValidationError('Either email or userId must be specified')
    }

    const target = (input.userId ? buildUserTarget(input.userId) : input.email)!
    const primaryResourceTarget: PrimaryInviteResourceTarget<WorkspaceInviteResourceTarget> =
      {
        resourceType: WorkspaceInviteResourceType,
        resourceId: workspaceId,
        role:
          (input.role ? mapGqlWorkspaceRoleToMainRole(input.role) : null) ||
          Roles.Workspace.Member,
        primary: true,
        secondaryResourceRoles: {
          ...(input.serverRole
            ? { [ServerInviteResourceType]: mapServerRoleToValue(input.serverRole) }
            : {})
        },
        workspaceSeatType: input.seatType || undefined
      }

    return await deps.createAndSendInvite(
      {
        target,
        inviterId,
        message: undefined,
        primaryResourceTarget
      },
      inviterResourceAccessRules
    )
  }

type CollectAndValidateWorkspaceTargetsFactoryDeps =
  CollectAndValidateCoreTargetsFactoryDeps & {
    getWorkspace: GetWorkspace
    getWorkspaceRoleAndSeat: GetWorkspaceRoleAndSeat
    validateWorkspaceMemberProjectRoleFactory: ValidateWorkspaceMemberProjectRole
    getWorkspaceDomains: GetWorkspaceDomains
    findVerifiedEmailsByUserId: FindVerifiedEmailsByUserId
    getStream: GetStream
  }

export const collectAndValidateWorkspaceTargetsFactory =
  (
    deps: CollectAndValidateWorkspaceTargetsFactoryDeps
  ): CollectAndValidateResourceTargets =>
  async (params) => {
    const coreCollector = collectAndValidateCoreTargetsFactory(deps)
    const baseTargets = await coreCollector(params)

    const {
      input,
      inviter,
      targetUser,
      inviterResourceAccessLimits,
      finalizingInvite
    } = params
    const primaryResourceTarget = input.primaryResourceTarget
    const primaryWorkspaceResourceTarget = isWorkspaceResourceTarget(
      primaryResourceTarget
    )
      ? primaryResourceTarget
      : null
    const chosenWorkspaceSeatType =
      primaryResourceTarget.workspaceSeatType || WorkspaceSeatType.Viewer

    const targetWorkspaceRole =
      primaryWorkspaceResourceTarget?.role ||
      input.primaryResourceTarget.secondaryResourceRoles?.[
        WorkspaceInviteResourceType
      ] ||
      Roles.Workspace.Guest
    const targetWorkspaceSeatType =
      targetWorkspaceRole === Roles.Workspace.Admin
        ? WorkspaceSeatType.Editor
        : chosenWorkspaceSeatType

    // Role based checks
    if (!Object.values(Roles.Workspace).includes(targetWorkspaceRole)) {
      throw new InviteCreateValidationError('Unexpected workspace invite role')
    }

    if (targetWorkspaceRole === Roles.Workspace.Admin) {
      const serverGuestInvite = baseTargets.find(
        (target) =>
          target.resourceType === ServerInviteResourceType &&
          target.role === Roles.Server.Guest
      )
      if (targetUser?.role === Roles.Server.Guest || serverGuestInvite)
        throw new InviteCreateValidationError(
          'Guest users cannot be admins of workspaces'
        )
    }

    // Validate target workspace - if primary resource target, or a secondary one
    // This might be a workspace project invite, validate that
    let workspaceId: string | null = null
    if (primaryWorkspaceResourceTarget) {
      workspaceId = primaryWorkspaceResourceTarget.resourceId
    } else {
      const projectId = baseTargets.find(
        (t) => t.resourceType === ProjectInviteResourceType
      )?.resourceId
      const project = projectId ? await deps.getStream({ streamId: projectId }) : null
      workspaceId = project?.workspaceId || null
    }

    // Not related to any specific workspace, skip further validation
    if (!workspaceId) {
      return [...baseTargets]
    }

    const [workspace, workspaceRoleAndSeat] = await Promise.all([
      deps.getWorkspace({
        workspaceId
      }),
      ...(targetUser?.id
        ? [
            deps.getWorkspaceRoleAndSeat({
              workspaceId,
              userId: targetUser.id
            })
          ]
        : [])
    ])
    if (!workspace) {
      throw new InviteCreateValidationError(
        'Attempting to invite into a non-existant workspace'
      )
    }

    const workspaceRole = workspaceRoleAndSeat?.role.role

    // If inviting to workspace project, validate target role
    const projectTarget = baseTargets.find(isProjectResourceTarget)
    const projectRole = projectTarget?.role
    if (projectRole && targetUser) {
      // If target seat type was specified w/ invite, use that (cause we're gonna switch to that upon accept)
      const seatType =
        primaryResourceTarget.workspaceSeatType ||
        (workspaceRoleAndSeat
          ? workspaceRoleAndSeat.seat.type
          : targetWorkspaceSeatType)

      await deps.validateWorkspaceMemberProjectRoleFactory({
        workspaceId,
        userId: targetUser.id,
        projectRole,
        workspaceAccess: workspaceRoleAndSeat
          ? {
              role: workspaceRoleAndSeat.role.role,
              seatType
            }
          : {
              role: targetWorkspaceRole,
              seatType
            }
      })

      // If project target is primary and user target is already a workspace member, mark invite as auto-acceptable
      if (isPrimaryResourceTarget(projectTarget) && workspaceRole) {
        projectTarget.autoAccept = true
      }
    }

    // Do further validation only if we're actually planning to invite to a workspace
    // (maybe the invitation is implicitly there, but user already is a member of the workspace)
    const isInvitingToWorkspace =
      primaryWorkspaceResourceTarget || (workspace && !workspaceRole)
    if (!isInvitingToWorkspace) {
      return [...baseTargets]
    }

    // Validate that inviter has access to this workspace
    try {
      await authorizeResolver(
        inviter.id,
        workspaceId,
        Roles.Workspace.Admin,
        inviterResourceAccessLimits
      )
    } catch (e) {
      throw new InviteCreateValidationError(
        "Inviter doesn't have admin access to the workspace",
        { cause: e as Error }
      )
    }

    // Only check this on creation, on finalization its fine if the user's already a member
    if (workspaceRole && !finalizingInvite) {
      throw new InviteCreateValidationError(
        'The target user is already a member of the specified workspace'
      )
    }

    if (
      targetWorkspaceRole !== Roles.Workspace.Guest &&
      workspace.domainBasedMembershipProtectionEnabled
    ) {
      const workspaceDomains = await deps.getWorkspaceDomains({
        workspaceIds: [workspaceId]
      })

      if (targetUser) {
        const userEmails = await deps.findVerifiedEmailsByUserId({
          userId: targetUser.id
        })
        if (
          !userEmailsCompliantWithWorkspaceDomains({
            userEmails,
            workspaceDomains
          })
        )
          throw new WorkspaceProtectedError(
            'The target user has no verified emails matching the domain policies'
          )
      } else {
        // its a new server invite, we need to validate the email here too
        if (
          !anyEmailCompliantWithWorkspaceDomains({
            emails: [input.target],
            workspaceDomains
          })
        )
          throw new WorkspaceProtectedError(
            'The invited email does not match the domain policies'
          )
      }
    }

    const finalWorkspaceResourceTarget:
      | PrimaryInviteResourceTarget<WorkspaceInviteResourceTarget>
      | WorkspaceInviteResourceTarget = primaryWorkspaceResourceTarget
      ? {
          ...primaryWorkspaceResourceTarget,
          primary: true
        }
      : {
          resourceId: workspaceId,
          resourceType: WorkspaceInviteResourceType,
          role: targetWorkspaceRole
        }

    return [...baseTargets, finalWorkspaceResourceTarget]
  }

type BuildWorkspaceInviteEmailContentsFactoryDeps = BuildInviteContentsFactoryDeps & {
  getWorkspace: GetWorkspace
}

export const buildWorkspaceInviteEmailContentsFactory =
  (deps: BuildWorkspaceInviteEmailContentsFactoryDeps): BuildInviteEmailContents =>
  async (params) => {
    const { invite, inviter } = params
    const primaryResourceTarget = invite.resource
    const coreEmailBuilder = buildCoreInviteEmailContentsFactory(deps)

    if (!isWorkspaceResourceTarget(primaryResourceTarget)) {
      return await coreEmailBuilder(params)
    }

    // Build workspace invite email contents
    const workspace = await deps.getWorkspace({
      workspaceId: primaryResourceTarget.resourceId
    })
    if (!workspace) {
      throw new InviteCreateValidationError(
        'Attempting to invite into a non-existant workspace'
      )
    }

    const subject = `${inviter.name} has invited you to the "${workspace.name}" Speckle workspace`
    const inviteLink = new URL(
      `${getWorkspaceRoute(workspace.slug)}?token=${invite.token}&accept=true`,
      getFrontendOrigin()
    ).toString()

    const mjml = {
      bodyStart: `
  <mj-text align="center" line-height="2">
  Hello!
  <br />
  <br />
  ${inviter.name} has just sent you this invitation to join the <b>${workspace.name}</b> workspace!
  </mj-text>
  `,
      bodyEnd:
        '<mj-text align="center" line-height="2">Feel free to ignore this invite if you do not know the person sending it.</mj-text>'
    }
    const text = {
      bodyStart: `Hello!

${inviter.name} has just sent you this invitation to join the "${workspace.name}" workspace!`,
      bodyEnd:
        'Feel free to ignore this invite if you do not know the person sending it.'
    }

    return {
      emailParams: {
        mjml,
        text,
        cta: {
          title: 'Accept the invitation',
          url: inviteLink
        }
      },
      subject
    }
  }

function buildPendingWorkspaceCollaboratorModel(
  invite: ExtendedInvite<WorkspaceInviteResourceTarget | ProjectInviteResourceTarget>,
  targetUser: Nullable<UserRecord>,
  token?: string
): PendingWorkspaceCollaboratorGraphQLReturn {
  const { userEmail } = resolveTarget(invite.target)
  if (!invite.workspace) {
    throw new LogicError(
      'Retrieved implicit workspace invite without workspace metadata'
    )
  }

  const resource = invite.resource

  return {
    id: `invite:${invite.id}`,
    inviteId: invite.id,
    title: resolveInviteTargetTitle(invite, targetUser),
    invitedById: invite.inviterId,
    user: targetUser ? removePrivateFields(targetUser) : null,
    updatedAt: invite.updatedAt,
    email: targetUser?.email || userEmail || '',
    token,
    workspaceId: invite.workspace.id,
    role:
      (isWorkspaceResourceTarget(resource)
        ? resource.role
        : resource.secondaryResourceRoles?.[WorkspaceInviteResourceType]) ||
      Roles.Workspace.Member
  }
}

export const getUserPendingWorkspaceInviteFactory =
  (deps: {
    findInvite: FindInvite
    getUser: GetUser
    getWorkspaceBySlug: GetWorkspaceBySlug
  }) =>
  async (params: {
    workspaceId?: MaybeNullOrUndefined<string>
    workspaceSlug?: MaybeNullOrUndefined<string>
    userId: MaybeNullOrUndefined<string>
    token: MaybeNullOrUndefined<string>
  }) => {
    const { userId, token, workspaceSlug } = params
    let { workspaceId } = params

    if (!userId?.length && !token?.length) return null
    if (!token?.length && !(workspaceId?.length || workspaceSlug?.length)) return null

    const userTarget = userId ? buildUserTarget(userId) : undefined
    if (!workspaceId?.length && workspaceSlug?.length) {
      workspaceId = (await deps.getWorkspaceBySlug({ workspaceSlug }))?.id
    }

    const invite = await deps.findInvite<WorkspaceInviteResourceTarget>({
      target: !token ? userTarget : undefined,
      token: token || undefined,
      resourceFilter: {
        resourceType: WorkspaceInviteResourceType,
        resourceId: workspaceId || undefined
      }
    })
    if (!invite) return null

    const targetUserId = resolveTarget(invite.target).userId
    const targetUser = targetUserId ? await deps.getUser(targetUserId) : null

    return buildPendingWorkspaceCollaboratorModel(
      invite,
      targetUser,
      token || undefined
    )
  }

export const getUserPendingWorkspaceInvitesFactory =
  (deps: { getUserResourceInvites: QueryAllUserResourceInvites; getUser: GetUser }) =>
  async (userId: string): Promise<PendingWorkspaceCollaboratorGraphQLReturn[]> => {
    if (!userId) return []

    const targetUser = await deps.getUser(userId)
    if (!targetUser) {
      throw new InviteNotFoundError('Nonexistant user specified')
    }

    const invites = await deps.getUserResourceInvites<WorkspaceInviteResourceTarget>({
      userId,
      resourceType: WorkspaceInviteResourceType
    })
    return invites.map((i) => buildPendingWorkspaceCollaboratorModel(i, targetUser))
  }

export const getPendingWorkspaceCollaboratorsFactory =
  (deps: {
    queryAllResourceInvites: QueryAllResourceInvites
    getInvitationTargetUsers: GetInvitationTargetUsers
  }) =>
  async (params: {
    workspaceId: string
    filter?: MaybeNullOrUndefined<PendingWorkspaceCollaboratorsFilter>
  }): Promise<PendingWorkspaceCollaboratorGraphQLReturn[]> => {
    const { workspaceId, filter } = params

    // Get all pending invites
    const invites = await deps.queryAllResourceInvites<WorkspaceInviteResourceTarget>({
      resourceId: workspaceId,
      resourceType: WorkspaceInviteResourceType,
      search: filter?.search || undefined
    })

    // Get all target users, if any
    const usersById = await deps.getInvitationTargetUsers({ invites })

    // Build results
    const results = []
    for (const invite of invites) {
      let user: UserRecord | null = null
      const { userId } = resolveTarget(invite.target)
      if (userId && usersById[userId]) {
        user = usersById[userId]
      }

      results.push(buildPendingWorkspaceCollaboratorModel(invite, user))
    }
    return results
  }

export const validateWorkspaceInviteBeforeFinalizationFactory =
  (deps: {
    getWorkspace: GetWorkspace
    validateProjectInviteBeforeFinalization: ValidateResourceInviteBeforeFinalization
  }): ValidateResourceInviteBeforeFinalization =>
  async (params) => {
    const { invite, finalizerUserId, action, finalizerResourceAccessLimits } = params

    const resourceType = invite.resource.resourceType
    if (resourceType !== WorkspaceInviteResourceType) {
      // If this is a project invite, delegate to the project invite validator
      // (may be an implicit workspace invite)
      if (resourceType === ProjectInviteResourceType) {
        return await deps.validateProjectInviteBeforeFinalization(params)
      } else {
        throw new InviteFinalizingError(
          'Attempting to finalize non-workspace invite as workspace invite',
          { info: { invite, finalizerUserId } }
        )
      }
    }

    // If decline, skip all further validation
    if (action === InviteFinalizationAction.DECLINE) {
      return
    }

    const workspace = await deps.getWorkspace({
      workspaceId: invite.resource.resourceId,
      userId: finalizerUserId
    })
    if (!workspace) {
      throw new InviteFinalizingError(
        'Attempting to finalize invite to a non-existant workspace'
      )
    }

    if (action === InviteFinalizationAction.CANCEL) {
      if (workspace.role !== Roles.Workspace.Admin) {
        throw new InviteFinalizingError(
          'Attempting to cancel invite to a workspace that the user does not own'
        )
      }
    } else {
      // We now allow accepting an invite even if the user is already a member of the workspace
      // (to get extra emails, for example)
      // if (workspace.role) {
      //   throw new InviteFinalizingError(
      //     'Attempting to finalize invite to a workspace that the user already has access to'
      //   )
      // }
    }

    if (
      !isResourceAllowed({
        resourceId: workspace.id,
        resourceType: TokenResourceIdentifierType.Workspace,
        resourceAccessRules: finalizerResourceAccessLimits
      })
    ) {
      throw new InviteFinalizingError(
        'You are not allowed to process an invite for this workspace'
      )
    }
  }

export const processFinalizedWorkspaceInviteFactory =
  (deps: {
    getWorkspace: GetWorkspace
    updateWorkspaceRole: ReturnType<typeof addOrUpdateWorkspaceRoleFactory>
    processFinalizedProjectInvite: ProcessFinalizedResourceInvite
  }): ProcessFinalizedResourceInvite =>
  async (params) => {
    const { invite, finalizerUserId, action } = params

    if (!isWorkspaceResourceTarget(invite.resource)) {
      // If this is a project invite, delegate to the project invite processor
      // (may be an implicit workspace invite)
      if (isProjectResourceTarget(invite.resource)) {
        return deps.processFinalizedProjectInvite(params)
      } else {
        throw new InviteFinalizingError(
          'Attempting to finalize non-workspace invite as workspace invite',
          { info: params }
        )
      }
    }

    if (action === InviteFinalizationAction.DECLINE) {
      // Skip validation so user can get rid of the invite regardless
      // TODO: Emit activityStream event?
      return
    }

    const workspace = await deps.getWorkspace({
      workspaceId: invite.resource.resourceId,
      userId: finalizerUserId
    })
    if (!workspace) {
      throw new InviteFinalizingError(
        'Attempting to finalize invite to a non-existant workspace'
      )
    }

    if (action === InviteFinalizationAction.ACCEPT) {
      await deps.updateWorkspaceRole({
        userId: finalizerUserId,
        workspaceId: workspace.id,
        role: invite.resource.role || Roles.Workspace.Member,
        preventRoleDowngrade: true,
        updatedByUserId: invite.inviterId,
        seatType: invite.resource.workspaceSeatType
      })
    }
  }
