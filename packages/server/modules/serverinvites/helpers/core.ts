import { LimitedUserRecord } from '@/modules/core/helpers/types'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import {
  InviteResourceTarget,
  PrimaryInviteResourceTarget,
  ProjectInviteResourceTarget,
  ServerInviteRecord,
  ServerInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import { Nullable, Optional, ServerRoles, StreamRoles } from '@speckle/shared'

export type ResolvedTargetData = {
  userId: string | null
  userEmail: string | null
}

/**
 * Resolve target information. The target can either be an email address or a user ID
 * prefixed by an @ character
 */
export function resolveTarget(target: string): ResolvedTargetData {
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
 */
export function buildUserTarget(userId: string): string {
  return `@${userId}`
}

/**
 * Resolve a display name for the user being invited.
 * User should be specified if invite targets a registered user.
 */
export function resolveInviteTargetTitle(
  invite: ServerInviteRecord,
  user: Nullable<LimitedUserRecord>
): string {
  const { userId, userEmail } = resolveTarget(invite.target)
  if (userId) {
    // User should be provided otherwise we have to fallback to an ugly ID identifier
    return user ? user.name : `#${userId}`
  }

  return userEmail!
}

export const isServerResourceTarget = (
  target: InviteResourceTarget
): target is ServerInviteResourceTarget =>
  target.resourceType === ServerInviteResourceType

export const isProjectResourceTarget = (
  target: InviteResourceTarget
): target is ProjectInviteResourceTarget =>
  target.resourceType === ProjectInviteResourceType

export interface ResourceTargetTypeRoleTypeMap {
  [ServerInviteResourceType]: ServerRoles
  [ProjectInviteResourceType]: StreamRoles
}

export const getResourceTypeRole = <T extends keyof ResourceTargetTypeRoleTypeMap>(
  resource: PrimaryInviteResourceTarget,
  type: T
): Optional<ResourceTargetTypeRoleTypeMap[T]> => {
  if (resource.resourceType === type) {
    return resource.role as ResourceTargetTypeRoleTypeMap[T]
  }

  const secondaryRoles = resource.secondaryResourceRoles
  return secondaryRoles?.[type]
}
