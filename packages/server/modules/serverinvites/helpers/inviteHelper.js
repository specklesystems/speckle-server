const ResourceTargets = Object.freeze({
  Streams: 'streams'
})

/**
 * @typedef {{
 *  resourceTarget?: string,
 *  resourceId?: string
 * }} InviteResourceData
 */

/**
 * @typedef {{
 *  target: string
 * }} InviteTargetData
 */

/**
 * @typedef {{
 *  userId: string | null,
 *  userEmail: string | null
 * }} ResolvedTargetData
 */

/**
 * @param {InviteResourceData} inviteOrParams
 * @returns {boolean}
 */
function isServerInvite(inviteOrParams) {
  if (!inviteOrParams) return false
  const { resourceTarget, resourceId } = inviteOrParams
  return !resourceTarget || !resourceId
}

/**
 * Check whether the invite is a stream invite
 * @param {InviteResourceData} inviteOrParams
 * @returns {boolean}
 */
function isStreamInvite(inviteOrParams) {
  return (
    inviteOrParams &&
    inviteOrParams.resourceTarget === ResourceTargets.Streams &&
    inviteOrParams.resourceId
  )
}

/**
 * Resolve target information. The target can either be an email address or a user ID
 * prefixed by an @ character
 * @param {string} target
 * @returns {ResolvedTargetData}
 */
function resolveTarget(target) {
  if (target.startsWith('@')) {
    return {
      userEmail: null,
      userId: target.substring(1)
    }
  } else {
    return {
      userEmail: target,
      userId: null
    }
  }
}

/**
 * Build a valid target value from a user ID
 * @param {string} userId
 * @returns {string}
 */
function buildUserTarget(userId) {
  if (!userId) return null
  return `@${userId}`
}

/**
 * Resolve a display name for the user being invited
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @param {import("@/modules/core/helpers/userHelper").LimitedUserRecord | null} user The user,
 * if invite targets a registered user.
 * @returns {string}
 */
function resolveInviteTargetTitle(invite, user) {
  const { userId, userEmail } = resolveTarget(invite.target)
  if (userId) {
    // User should be provided otherwise we have to fallback to an ugly ID identifier
    return user ? user.name : `#${userId}`
  }

  return userEmail
}

module.exports = {
  isServerInvite,
  isStreamInvite,
  resolveTarget,
  buildUserTarget,
  resolveInviteTargetTitle,
  ResourceTargets
}
