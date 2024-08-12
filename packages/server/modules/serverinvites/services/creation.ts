import crs from 'crypto-random-string'
import { getServerInfo } from '@/modules/core/services/generic'
import emailsModule from '@/modules/emails'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import sanitizeHtml from 'sanitize-html'
import {
  resolveTarget,
  buildUserTarget,
  ResolvedTargetData
} from '@/modules/serverinvites/helpers/core'
import { getUser, UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  FindInvite,
  FindUserByTarget,
  InsertInviteAndDeleteOld,
  MarkInviteUpdated,
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
import { MaybeNullOrUndefined } from '@speckle/shared'
import {
  PrimaryInviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { ServerInfo } from '@/modules/core/helpers/types'
import { EventBusEmit } from '@/modules/shared/services/eventBus'

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
    emitEvent
  }: {
    findUserByTarget: FindUserByTarget
    insertInviteAndDeleteOld: InsertInviteAndDeleteOld
    collectAndValidateResourceTargets: CollectAndValidateResourceTargets
    buildInviteEmailContents: BuildInviteEmailContents
    emitEvent: EventBusEmit
  }): CreateAndSendInvite =>
  async (params, inviterResourceAccessLimits?) => {
    const sendInviteEmail = sendInviteEmailFactory({ buildInviteEmailContents })
    const { inviterId } = params
    let { target } = params
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

    if (targetData.userId) {
      target = buildUserTarget(targetData.userId)!
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
    const finalPrimaryResource = resources.find(
      (r): r is PrimaryInviteResourceTarget => 'primary' in r && r.primary
    )
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

    await emitEvent({
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
    findUserByTarget,
    findInvite,
    markInviteUpdated
  }: {
    buildInviteEmailContents: BuildInviteEmailContents
    findUserByTarget: FindUserByTarget
    findInvite: FindInvite
    markInviteUpdated: MarkInviteUpdated
  }): ResendInviteEmail =>
  async (params: { inviteId: string }) => {
    const sendInviteEmail = sendInviteEmailFactory({ buildInviteEmailContents })
    const { inviteId } = params
    const invite = await findInvite({ inviteId })
    if (!invite) {
      throw new InviteCreateValidationError('Invite not found')
    }

    const [inviter, targetUser, serverInfo] = await Promise.all([
      getUser(invite.inviterId),
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

    await markInviteUpdated({ inviteId })
  }
