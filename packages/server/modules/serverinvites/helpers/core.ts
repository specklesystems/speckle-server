import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

type ResolvedTargetData = {
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
export function buildUserTarget(
  userId: MaybeNullOrUndefined<string>
): Nullable<string> {
  if (!userId) return null
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
