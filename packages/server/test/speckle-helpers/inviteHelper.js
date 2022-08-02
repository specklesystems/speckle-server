const { Roles } = require('@/modules/core/helpers/mainConstants')
const {
  buildUserTarget,
  ResourceTargets
} = require('@/modules/serverinvites/helpers/inviteHelper')
const {
  createAndSendInvite
} = require('@/modules/serverinvites/services/inviteCreationService')

/**
 * Create a new invite. User & userId are alternatives for each other, and so
 * are stream & streamId
 * @param {{
 *  email?: string,
 *  user?: import("@/modules/core/helpers/userHelper").UserRecord,
 *  userId?: string,
 *  message?: string,
 *  stream?: Object,
 *  streamId?: string
 * }} invite
 * @param {string} creatorId
 *
 * @returns {Promise<{inviteId: string, token: string}>}
 */
function createInviteDirectly(invite, creatorId) {
  const userId = invite.userId || invite.user?.id || null
  const email = invite.email || null
  if (!userId && !email) throw new Error('Either user/userId or email must be set')

  const streamId = invite.streamId || invite.stream?.id || null

  return createAndSendInvite({
    target: email || buildUserTarget(userId),
    inviterId: creatorId,
    message: invite.message,
    resourceTarget: streamId ? ResourceTargets.Streams : null,
    resourceId: streamId || null,
    role: streamId ? Roles.Stream.Contributor : null
  })
}

module.exports = {
  createInviteDirectly
}
