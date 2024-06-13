import crs from 'crypto-random-string'
import { getServerInfo } from '@/modules/core/services/generic'
import emailsModule from '@/modules/emails'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import sanitizeHtml from 'sanitize-html'
import {
  resolveTarget,
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import { addStreamInviteSentOutActivity } from '@/modules/activitystream/services/streamActivity'
import { TokenResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import { CreateInviteParams, ServerInvitesRepository } from '../domain'
import { validateInput } from './validation'
import { buildEmailContents } from './buildEmailContents'
import { ServerInviteRecord } from '../helpers/types'

/**
 * Create and send out an invite
 */
export const createAndSendInvite =
  ({
    serverInvitesRepository
  }: {
    serverInvitesRepository: Pick<
      ServerInvitesRepository,
      'findUserByTarget' | 'findResource' | 'insertInviteAndDeleteOld'
    >
  }) =>
  async (
    params: CreateInviteParams,
    inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
  ) => {
    const { inviterId, resourceTarget, resourceId, role, serverRole } = params
    let { message, target } = params

    const [inviter, targetUser, resource, serverInfo] = await Promise.all([
      getUser(inviterId, { withRole: true }),
      serverInvitesRepository.findUserByTarget(target),
      serverInvitesRepository.findResource(params),
      getServerInfo()
    ])

    // if target user found, always use the user ID
    if (targetUser) target = buildUserTarget(targetUser.id)!
    const { userEmail, userId } = resolveTarget(target)

    // validate inputs
    await validateInput(
      params,
      inviter,
      resource,
      targetUser,
      inviterResourceAccessLimits
    )

    // Sanitize msg
    // TODO: We should just use TipTap here
    if (message) {
      message = sanitizeMessage(message)
    }

    // validate server role
    if (serverRole && !Object.values(Roles.Server).includes(serverRole)) {
      throw new InviteCreateValidationError('Invalid server role')
    }
    if (inviter?.role !== Roles.Server.Admin && serverRole === Roles.Server.Admin) {
      throw new InviteCreateValidationError(
        'Only server admins can assign the admin server role'
      )
    }
    if (serverRole === Roles.Server.Guest && !serverInfo.guestModeEnabled) {
      throw new InviteCreateValidationError('Guest mode is not enabled on this server')
    }
    if (targetUser && targetUser.role === Roles.Server.Guest) {
      if (role === Roles.Stream.Owner) {
        throw new InviteCreateValidationError(
          'Guest users cannot be owners of projects'
        )
      }
    }

    // write to DB
    const invite = {
      id: crs({ length: 20 }),
      target,
      inviterId,
      message: message ?? null,
      resourceTarget: resourceTarget ?? null,
      resourceId: resourceId ?? null,
      role: role ?? null,
      token: crs({ length: 50 }),
      serverRole: serverRole ?? null
    }
    await serverInvitesRepository.insertInviteAndDeleteOld(
      invite,
      targetUser ? [targetUser.email, buildUserTarget(targetUser.id)!] : []
    )

    // generate and send email
    const emailParams = await buildEmailContents(invite, inviter!, resource, targetUser)

    // send email and create activity stream item, if stream invite
    await Promise.all([
      emailsModule.sendEmail(emailParams),
      ...(resourceTarget === ResourceTargets.Streams
        ? [
            addStreamInviteSentOutActivity({
              streamId: resourceId!, // TODO: check null
              inviterId,
              inviteTargetEmail: userEmail!, // TODO: this should be properly typed
              inviteTargetId: userId! // TODO: this should be properly typed
            })
          ]
        : [])
    ])

    return {
      inviteId: invite.id,
      token: invite.token
    }
  }

/**
 * Sanitize message that potentially has HTML in it
 */
function sanitizeMessage(message: string, stripAll: boolean = false) {
  return sanitizeHtml(message, {
    allowedTags: stripAll ? [] : ['b', 'i', 'em', 'strong']
  })
}

/**
 * Re-send existing invite email
 */
export const resendInviteEmail =
  ({
    serverInvitesRepository
  }: {
    serverInvitesRepository: Pick<
      ServerInvitesRepository,
      'findResource' | 'findUserByTarget'
    >
  }) =>
  async (invite: ServerInviteRecord) => {
    const { inviterId, target } = invite

    const [inviter, targetUser, resource] = await Promise.all([
      getUser(inviterId),
      serverInvitesRepository.findUserByTarget(target),
      serverInvitesRepository.findResource(
        invite as {
          resourceId?: string | null
          resourceTarget?: typeof ResourceTargets.Streams | null
        }
      )
    ])

    // TODO: check nullable inviter
    const emailParams = await buildEmailContents(invite, inviter!, resource, targetUser)
    await emailsModule.sendEmail(emailParams)
  }

/**
 * Invite users to be contributors for the specified stream
 */
export const inviteUsersToStream =
  ({
    serverInvitesRepository
  }: {
    serverInvitesRepository: Pick<
      ServerInvitesRepository,
      'findUserByTarget' | 'findResource' | 'insertInviteAndDeleteOld'
    >
  }) =>
  async (
    inviterId: string,
    streamId: string,
    userIds: string[],
    inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
  ): Promise<boolean> => {
    const users = await getUsers(userIds)
    if (!users.length) return false

    const inviteParamsArray = users.map((u) => ({
      target: buildUserTarget(u.id)!,
      inviterId,
      resourceTarget: ResourceTargets.Streams,
      resourceId: streamId,
      role: Roles.Stream.Contributor
    }))

    await Promise.all(
      inviteParamsArray.map((p) =>
        createAndSendInvite({ serverInvitesRepository })(p, inviterResourceAccessLimits)
      )
    )

    return true
  }
