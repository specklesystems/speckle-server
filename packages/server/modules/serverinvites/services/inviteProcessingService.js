const { Roles } = require('@/modules/core/helpers/mainConstants')
const { getStreamRoute } = require('@/modules/core/helpers/routeHelper')
const { NoInviteFoundError } = require('@/modules/serverinvites/errors')
const {
  isStreamInvite,
  buildUserTarget,
  ResourceTargets
} = require('@/modules/serverinvites/helpers/inviteHelper')
const {
  getServerInvite,
  deleteServerOnlyInvites,
  updateAllInviteTargets,
  getStreamInvite,
  deleteStreamInvite,
  getInvite,
  deleteInvite: deleteInviteFromDb,
  deleteInvitesByTarget
} = require('@/modules/serverinvites/repositories')
const {
  resendInviteEmail
} = require('@/modules/serverinvites/services/inviteCreationService')
const {
  addOrUpdateStreamCollaborator
} = require('@/modules/core/services/streams/streamAccessService')

/**
 * Resolve the relative auth redirect path, after registering with an invite
 * Note: Important auth query string params like the access_code are added separately
 * in auth middlewares
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord | undefined} invite
 * @returns {string}
 */
function resolveAuthRedirectPath(invite) {
  if (invite) {
    const { resourceId } = invite

    if (isStreamInvite(invite)) {
      return `${getStreamRoute(resourceId)}`
    }
  }

  // Fall-back to base URL (for server invites)
  return process.env.CANONICAL_URL
}

/**
 * Validate that the new user has a valid invite for registering to the server
 * @param {Object} email User's email address
 * @param {string} inviteId Invite ID
 * @returns {import('@/modules/serverinvites/repositories').ServerInviteRecord}
 */
async function validateServerInvite(email, inviteId) {
  const invite = await getServerInvite(email, inviteId)
  if (!invite) {
    throw new NoInviteFoundError(
      inviteId
        ? "Wrong e-mail address or invite ID. Make sure you're using the same e-mail address that received the invite."
        : "Wrong e-mail address. Make sure you're using the same e-mail address that received the invite.",
      {
        info: {
          email,
          inviteId
        }
      }
    )
  }

  return invite
}

/**
 * Finalize server registration by deleting unnecessary invites and updating
 * the remaining ones
 * @param {string} email
 * @param {string} userId
 */
async function finalizeInvitedServerRegistration(email, userId) {
  // Delete all server-only invites for this email
  await deleteServerOnlyInvites(email)

  // Update all remaining invites to use a userId target, not the e-mail
  // (in case the user changes his e-mail right after)
  await updateAllInviteTargets(email, buildUserTarget(userId))
}

/**
 * Accept or decline a stream invite
 * @param {boolean} accept
 * @param {string} streamId
 * @param {string} inviteId
 * @param {string} userId User who's accepting the invite
 */
async function finalizeStreamInvite(accept, streamId, inviteId, userId) {
  const invite = await getStreamInvite(streamId, buildUserTarget(userId), inviteId)
  if (!invite) {
    throw new NoInviteFoundError('Attempted to finalize nonexistant stream invite', {
      info: {
        streamId,
        inviteId,
        userId
      }
    })
  }

  // Invite found - accept or decline
  if (accept) {
    // Add access for user
    const { role = Roles.Stream.Contributor, inviterId } = invite
    await addOrUpdateStreamCollaborator(streamId, userId, role, inviterId, {
      fromInvite: true
    })

    // Delete all invites to this stream
    await deleteInvitesByTarget(
      buildUserTarget(userId),
      ResourceTargets.Streams,
      streamId
    )
  }

  // Delete all invites to this stream
  await deleteInvitesByTarget(
    buildUserTarget(userId),
    ResourceTargets.Streams,
    streamId
  )
}

/**
 * Cancel/decline a stream invite
 * @param {string} streamId
 * @param {string} inviteId
 */
async function cancelStreamInvite(streamId, inviteId) {
  const invite = await getStreamInvite(streamId, null, inviteId)
  if (!invite) {
    throw new NoInviteFoundError('Attempted to process nonexistant stream invite', {
      info: {
        streamId,
        inviteId
      }
    })
  }

  // Delete invite
  await deleteStreamInvite(invite.id)
}

/**
 * Re-send pending invite e-mail, without creating a new invite
 * @param {string} inviteId
 */
async function resendInvite(inviteId) {
  const invite = await getInvite(inviteId)
  if (!invite) {
    throw new NoInviteFoundError('Attempted to re-send a nonexistant invite')
  }

  await resendInviteEmail(invite)
}

/**
 * Delete pending invite
 * @param {string} inviteId
 */
async function deleteInvite(inviteId) {
  const invite = await getInvite(inviteId)
  if (!invite) {
    throw new NoInviteFoundError('Attempted to delete a nonexistant invite')
  }

  await deleteInviteFromDb(invite.id)
}

module.exports = {
  validateServerInvite,
  resolveAuthRedirectPath,
  finalizeInvitedServerRegistration,
  finalizeStreamInvite,
  cancelStreamInvite,
  resendInvite,
  deleteInvite
}
