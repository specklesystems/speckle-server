import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { WorkspaceInviteCreateInput } from '@/modules/core/graph/generated/graphql'
import { getWorkspaceRoute } from '@/modules/core/helpers/routeHelper'
import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { QueryAllResourceInvites } from '@/modules/serverinvites/domain/operations'
import {
  InviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  resolveInviteTargetTitle,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import {
  buildCoreInviteEmailContentsFactory,
  BuildInviteContentsFactoryDeps
} from '@/modules/serverinvites/services/coreEmailContents'
import {
  collectAndValidateCoreTargetsFactory,
  CollectAndValidateCoreTargetsFactoryDeps
} from '@/modules/serverinvites/services/coreResourceCollection'
import {
  BuildInviteEmailContents,
  CollectAndValidateResourceTargets,
  CreateAndSendInvite,
  GetInvitationTargetUsers
} from '@/modules/serverinvites/services/operations'
import { authorizeResolver } from '@/modules/shared'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { GetWorkspace } from '@/modules/workspaces/domain/operations'
import { WorkspaceInviteResourceTarget } from '@/modules/workspaces/domain/types'
import { mapGqlWorkspaceRoleToMainRole } from '@/modules/workspaces/helpers/roles'
import { PendingWorkspaceCollaboratorGraphQLReturn } from '@/modules/workspacesCore/helpers/graphTypes'
import { MaybeNullOrUndefined, Nullable, Roles, WorkspaceRoles } from '@speckle/shared'

const isWorkspaceResourceTarget = (
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
    const primaryResourceTarget: WorkspaceInviteResourceTarget = {
      resourceType: WorkspaceInviteResourceType,
      resourceId: workspaceId,
      role:
        (input.role ? mapGqlWorkspaceRoleToMainRole(input.role) : null) ||
        Roles.Workspace.Member,
      primary: true
    }

    await deps.createAndSendInvite(
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
  }

export const collectAndValidateWorkspaceTargetsFactory =
  (
    deps: CollectAndValidateWorkspaceTargetsFactoryDeps
  ): CollectAndValidateResourceTargets =>
  async (params) => {
    const coreCollector = collectAndValidateCoreTargetsFactory(deps)
    const baseTargets = (await coreCollector(params)).map((t) => ({
      ...t,
      primary: false
    }))

    const { input, inviter, targetUser, inviterResourceAccessLimits } = params
    const primaryWorkspaceResourceTarget = isWorkspaceResourceTarget(
      input.primaryResourceTarget
    )
      ? input.primaryResourceTarget
      : null
    if (!primaryWorkspaceResourceTarget) {
      return [...baseTargets]
    }

    const { role, resourceId } = primaryWorkspaceResourceTarget

    // Validate that inviter has access to this project
    try {
      await authorizeResolver(
        inviter.id,
        resourceId,
        Roles.Workspace.Admin,
        inviterResourceAccessLimits
      )
    } catch (e) {
      throw new InviteCreateValidationError(
        "Inviter doesn't have proper access to the resource",
        { cause: e as Error }
      )
    }

    const workspace = await deps.getWorkspace({
      workspaceId: resourceId,
      userId: targetUser?.id
    })
    if (!workspace) {
      throw new InviteCreateValidationError(
        'Attempting to invite into a non-existant workspace'
      )
    }
    if (workspace.role) {
      throw new InviteCreateValidationError(
        'The target user is already a member of the specified workspace'
      )
    }
    if (!Object.values(Roles.Workspace).includes(role)) {
      throw new InviteCreateValidationError('Unexpected workspace invite role')
    }
    if (targetUser?.role === Roles.Server.Guest && role === Roles.Workspace.Admin) {
      throw new InviteCreateValidationError(
        'Guest users cannot be admins of workspaces'
      )
    }

    return [...baseTargets, primaryWorkspaceResourceTarget]
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
      `${getWorkspaceRoute(workspace.id)}?token=${invite.token}&accept=true`,
      getFrontendOrigin()
    ).toString()

    const mjml = {
      bodyStart: `
  <mj-text>
  Hello!
  <br />
  <br />
  ${inviter.name} has just sent you this invitation to join the <b>${workspace.name}</b> workspace!
  </mj-text>
  `,
      bodyEnd:
        '<mj-text>Feel free to ignore this invite if you do not know the person sending it.</mj-text>'
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
  invite: ServerInviteRecord<WorkspaceInviteResourceTarget>,
  targetUser: Nullable<LimitedUserRecord>
): PendingWorkspaceCollaboratorGraphQLReturn {
  return {
    id: `invite:${invite.id}`,
    inviteId: invite.id,
    workspaceId: invite.resource.resourceId,
    title: resolveInviteTargetTitle(invite, targetUser),
    role: invite.resource.role || Roles.Workspace.Member,
    invitedById: invite.inviterId,
    user: targetUser
  }
}

export const getPendingWorkspaceCollaboratorsFactory =
  (deps: {
    queryAllResourceInvites: QueryAllResourceInvites
    getInvitationTargetUsers: GetInvitationTargetUsers
  }) =>
  async (params: {
    workspaceId: string
  }): Promise<PendingWorkspaceCollaboratorGraphQLReturn[]> => {
    const { workspaceId } = params

    // Get all pending invites
    const invites = await deps.queryAllResourceInvites<
      typeof WorkspaceInviteResourceType,
      WorkspaceRoles
    >({
      resourceId: workspaceId,
      resourceType: WorkspaceInviteResourceType
    })

    // Get all target users, if any
    const usersById = await deps.getInvitationTargetUsers({ invites })

    // Build results
    const results = []
    for (const invite of invites) {
      let user: LimitedUserRecord | null = null
      const { userId } = resolveTarget(invite.target)
      if (userId && usersById[userId]) {
        user = removePrivateFields(usersById[userId])
      }

      results.push(buildPendingWorkspaceCollaboratorModel(invite, user))
    }

    return results
  }
