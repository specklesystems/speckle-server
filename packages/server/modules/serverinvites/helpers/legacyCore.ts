/**
 * This module refers to legacy logic that should no longer be used for new invites
 */

type InviteResourceData = {
  resourceTarget?: string | null
  resourceId?: string | null
}

export const ResourceTargets = Object.freeze({
  Streams: 'streams'
})

export function isServerInvite(inviteOrParams: InviteResourceData): boolean {
  if (!inviteOrParams) return false
  const { resourceTarget, resourceId } = inviteOrParams
  return !resourceTarget || !resourceId
}

export function isStreamInvite(inviteOrParams: InviteResourceData): boolean {
  return !!(
    inviteOrParams &&
    inviteOrParams.resourceTarget === ResourceTargets.Streams &&
    inviteOrParams.resourceId
  )
}
