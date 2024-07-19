import crs from 'crypto-random-string'
import { getServerInfo } from '@/modules/core/services/generic'
import emailsModule from '@/modules/emails'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import sanitizeHtml from 'sanitize-html'
import {
  resolveTarget,
  buildUserTarget,
  ResolvedTargetData,
  getPrimaryResourceTarget
} from '@/modules/serverinvites/helpers/core'
import {
  getUser,
  getUsers,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import {
  CreateInviteParams,
  EmitServerInvitesEvent,
  FindUserByTarget,
  InsertInviteAndDeleteOld,
  ServerInviteRecordInsertModel
} from '@/modules/serverinvites/domain/operations'
import {
  BuildInviteEmailContents,
  CollectAndValidateResourceTargets,
  CreateAndSendInvite,
  ResendInviteEmail
} from '@/modules/serverinvites/services/operations'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import { ServerInfo } from '@/modules/core/helpers/types'

const getFinalTargetData = (
  target: string,
  targetUser: MaybeNullOrUndefined<UserWithOptionalRole>
) => {
  if (targetUser) target = buildUserTarget(targetUser.id)!
  return resolveTarget(target)
}

/**
 * Sanitize message that potentially has HTML in it
 */
function sanitizeMessage(message: string, stripAll: boolean = false) {
  return sanitizeHtml(message, {
    allowedTags: stripAll ? [] : ['b', 'i', 'em', 'strong']
  })
}

const sendInviteEmailFactory =
  (deps: { buildInviteEmailContents: BuildInviteEmailContents }) =>
  async (params: {
    invite: ServerInviteRecord
    inviter: UserWithOptionalRole
    serverInfo: ServerInfo
    targetUser?: MaybeNullOrUndefined<UserWithOptionalRole>
    targetData: ResolvedTargetData
  }) => {
    const { invite, inviter, serverInfo, targetUser, targetData } = params

    const emailContents = await deps.buildInviteEmailContents({
      invite,
      inviter,
      serverInfo
    })
    const renderedEmail = await renderEmail(
      emailContents.emailParams,
      serverInfo,
      targetUser || null
    )

    // send email and emit event
    await emailsModule.sendEmail({
      subject: emailContents.subject,
      to: targetUser ? targetUser.email : targetData.userEmail!,
      ...renderedEmail
    })
  }

/**
 * Create and send out an invite
 */
export const createAndSendInviteFactory =
  ({
    findUserByTarget,
    insertInviteAndDeleteOld,
    collectAndValidateResourceTargets,
    buildInviteEmailContents,
    emitServerInvitesEvent
  }: {
    findUserByTarget: FindUserByTarget
    insertInviteAndDeleteOld: InsertInviteAndDeleteOld
    collectAndValidateResourceTargets: CollectAndValidateResourceTargets
    buildInviteEmailContents: BuildInviteEmailContents
    emitServerInvitesEvent: EmitServerInvitesEvent
  }): CreateAndSendInvite =>
  async (params, inviterResourceAccessLimits?) => {
    const sendInviteEmail = sendInviteEmailFactory({ buildInviteEmailContents })
    const { inviterId, target } = params
    let { message } = params

    const [inviter, targetUser, serverInfo] = await Promise.all([
      getUser(inviterId, { withRole: true }),
      findUserByTarget(target),
      getServerInfo()
    ])
    if (!inviter) throw new InviteCreateValidationError('Invalid inviter')

    // if target user found, always use the user ID
    const targetData = getFinalTargetData(target, targetUser)
    if (targetData.userId && !targetUser) {
      throw new InviteCreateValidationError('Attempting to invite an invalid user')
    }

    if (message && message.length >= 1024) {
      throw new InviteCreateValidationError('Personal message too long')
    }

    // collect and validate all resource targets
    const resources = await collectAndValidateResourceTargets({
      input: params,
      inviter,
      inviterResourceAccessLimits,
      target: targetData,
      targetUser,
      serverInfo
    })
    const finalPrimaryResource = getPrimaryResourceTarget(resources)
    if (!finalPrimaryResource) {
      throw new InviteCreateValidationError('No primary resource could be resolved')
    }

    // Sanitize msg
    // TODO: Can we use TipTap here?
    if (message) {
      message = sanitizeMessage(message)
    }

    // write to DB
    const invite: ServerInviteRecordInsertModel = {
      id: crs({ length: 20 }),
      target,
      inviterId,
      message: message ?? null,
      token: crs({ length: 50 }),
      resource: finalPrimaryResource
    }

    const { invite: finalInvite } = await insertInviteAndDeleteOld(
      invite,
      targetUser ? [targetUser.email, buildUserTarget(targetUser.id)!] : []
    )

    // generate and send email
    await sendInviteEmail({
      invite: finalInvite,
      inviter,
      serverInfo,
      targetUser,
      targetData
    })

    await emitServerInvitesEvent({
      eventName: ServerInvitesEvents.Created,
      payload: {
        invite: finalInvite
      }
    })

    return {
      inviteId: invite.id,
      token: invite.token
    }
  }

/**
 * Re-send existing invite email
 */
export const resendInviteEmailFactory =
  ({
    buildInviteEmailContents,
    findUserByTarget
  }: {
    buildInviteEmailContents: BuildInviteEmailContents
    findUserByTarget: FindUserByTarget
  }): ResendInviteEmail =>
  async (invite) => {
    const sendInviteEmail = sendInviteEmailFactory({ buildInviteEmailContents })
    const { inviterId } = invite

    const [inviter, targetUser, serverInfo] = await Promise.all([
      getUser(inviterId),
      findUserByTarget(invite.target),
      getServerInfo()
    ])
    if (!inviter) {
      throw new InviteCreateValidationError('Invite inviter no longer exists')
    }

    const targetData = getFinalTargetData(invite.target, targetUser)

    // generate and send email
    await sendInviteEmail({
      invite,
      inviter,
      serverInfo,
      targetUser,
      targetData
    })
  }

/**
 * Invite users to be contributors for the specified stream
 */
export const inviteUsersToStreamFactory =
  ({ createAndSendInvite }: { createAndSendInvite: CreateAndSendInvite }) =>
  async (
    inviterId: string,
    streamId: string,
    userIds: string[],
    inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
  ): Promise<boolean> => {
    const users = await getUsers(userIds)
    if (!users.length) return false

    const inviteParamsArray = users.map(
      (u): CreateInviteParams => ({
        target: buildUserTarget(u.id)!,
        inviterId,
        primaryResourceTarget: {
          resourceType: ProjectInviteResourceType,
          resourceId: streamId,
          role: Roles.Stream.Contributor,
          primary: true
        }
      })
    )

    await Promise.all(
      inviteParamsArray.map((p) => createAndSendInvite(p, inviterResourceAccessLimits))
    )

    return true
  }
