import { UserRecord } from '@/modules/core/helpers/types'
import { CreateInviteParams } from '@/modules/serverinvites/domain/operations'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  ResourceTargets,
  isServerInvite,
  resolveTarget
} from '@/modules/serverinvites/helpers/inviteHelper'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { authorizeResolver } from '@/modules/shared'
import { Roles } from '@speckle/shared'
import { getStreamCollaborator } from '@/modules/core/repositories/streams'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'

/**
 * Validate invite creation input data
 */
export async function validateInput(
  params: CreateInviteParams,
  inviter: UserRecord | null,
  resource?: { name: string } | null,
  targetUser?: UserWithOptionalRole | null,
  inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
) {
  const { message } = params

  // validate inviter & invitee
  validateTargetUser(params, targetUser)
  await validateInviter(params, inviter, inviterResourceAccessLimits)

  // validate resource
  await validateResource(params, resource, targetUser)

  // check if message too long
  if (message) {
    if (message.length >= 1024) {
      throw new InviteCreateValidationError('Personal message too long')
    }
  }
}

function validateTargetUser(
  params: CreateInviteParams,
  targetUser?: UserRecord | null
) {
  const { target } = params
  const { userId } = resolveTarget(target)

  if (userId && !targetUser) {
    throw new InviteCreateValidationError('Attempting to invite an invalid user')
  }

  if (isServerInvite(params) && targetUser) {
    throw new InviteCreateValidationError(
      'This email is already associated with an account on this server'
    )
  }
}

/**
 * Validate that the inviter has access to the resources he's trying to invite people to
 */
async function validateInviter(
  params: CreateInviteParams,
  inviter: UserRecord | null,
  inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
) {
  const { resourceId, resourceTarget } = params
  if (!inviter) throw new InviteCreateValidationError('Invalid inviter')
  if (isServerInvite(params)) return

  try {
    if (resourceTarget === ResourceTargets.Streams) {
      await authorizeResolver(
        inviter.id,
        resourceId!, // TODO: check null
        Roles.Stream.Owner,
        inviterResourceAccessLimits
      )
    } else {
      throw new InviteCreateValidationError('Unexpected resource target type')
    }
  } catch (e) {
    throw new InviteCreateValidationError(
      "Inviter doesn't have proper access to the resource",
      { cause: e as Error }
    )
  }
}

/**
 * Validate the target resource
 */
async function validateResource(
  params: CreateInviteParams,
  resource?: { name: string } | null,
  targetUser?: UserRecord | null
) {
  const { resourceId, resourceTarget, role } = params

  if (resourceId && !resource) {
    throw new InviteCreateValidationError("Couldn't resolve invite resource")
  }

  if (resourceTarget === ResourceTargets.Streams) {
    if (targetUser) {
      // Check if user isn't already associated with the stream
      const isStreamCollaborator = !!(await getStreamCollaborator(
        resourceId!, // TODO: verify this null
        targetUser.id
      ))
      if (isStreamCollaborator) {
        throw new InviteCreateValidationError(
          'The target user is already a collaborator of the specified project'
        )
      }
    }

    // TODO: check null role
    if (!Object.values(Roles.Stream).includes(role!)) {
      throw new InviteCreateValidationError('Unexpected stream invite role')
    }
  }
}
