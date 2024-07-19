import { getStreamRoute } from '@/modules/core/helpers/routeHelper'
import {
  InviteFinalizingError,
  NoInviteFoundError
} from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  isProjectResourceTarget
} from '@/modules/serverinvites/helpers/core'

import { getFrontendOrigin, useNewFrontend } from '@/modules/shared/helpers/envHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import {
  DeleteInvite,
  DeleteInvitesByTarget,
  DeleteServerOnlyInvites,
  EmitServerInvitesEvent,
  FindInvite,
  FindServerInvite,
  InsertInviteAndDeleteOld,
  UpdateAllInviteTargets
} from '@/modules/serverinvites/domain/operations'
import {
  FinalizeInvite,
  ProcessFinalizedResourceInvite,
  ValidateResourceInviteBeforeFinalization
} from '@/modules/serverinvites/services/operations'
import { ensureError } from '@speckle/shared'
import { noop } from 'lodash'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'

/**
 * Resolve the relative auth redirect path, after registering with an invite
 * Note: Important auth query string params like the access_code are added separately
 * in auth middlewares
 */
export const resolveAuthRedirectPathFactory = () => (invite?: ServerInviteRecord) => {
  if (useNewFrontend()) {
    // All post-auth redirects are handled by the frontend itself
    return getFrontendOrigin()
  }

  /**
   * @deprecated Deprecated user flow, only relevant in FE1. Thus no need to update it w/ support for workspaces
   * and other new features.
   */
  if (invite) {
    const primaryTarget = invite.resource
    if (isProjectResourceTarget(primaryTarget)) {
      return `${getStreamRoute(primaryTarget.resourceId)}`
    }
  }

  // Fall-back to base URL (for server invites)
  return getFrontendOrigin()
}

/**
 * Validate that the new user has a valid invite for registering to the server
 */
export const validateServerInviteFactory =
  ({ findServerInvite }: { findServerInvite: FindServerInvite }) =>
  async (email: string, token: string): Promise<ServerInviteRecord> => {
    const invite = await findServerInvite(email, token)
    if (!invite) {
      throw new NoInviteFoundError(
        token
          ? "Wrong e-mail address or invite token. Make sure you're using the same e-mail address that received the invite."
          : "Wrong e-mail address. Make sure you're using the same e-mail address that received the invite.",
        {
          info: {
            email,
            token
          }
        }
      )
    }

    return invite
  }

/**
 * Finalize server registration by deleting unnecessary invites and updating
 * the remaining ones
 */
export const finalizeInvitedServerRegistrationFactory =
  ({
    deleteServerOnlyInvites,
    updateAllInviteTargets
  }: {
    deleteServerOnlyInvites: DeleteServerOnlyInvites
    updateAllInviteTargets: UpdateAllInviteTargets
  }) =>
  async (email: string, userId: string) => {
    // Delete all server-only invites for this email
    await deleteServerOnlyInvites(email)

    // Update all remaining invites to use a userId target, not the e-mail
    // (in case the user changes his e-mail right after)
    await updateAllInviteTargets(email, buildUserTarget(userId)!)
  }

type FinalizeResourceInviteFactoryDeps = {
  findInvite: FindInvite
  validateInvite: ValidateResourceInviteBeforeFinalization
  processInvite: ProcessFinalizedResourceInvite
  deleteInvitesByTarget: DeleteInvitesByTarget
  insertInviteAndDeleteOld: InsertInviteAndDeleteOld
  emitServerInvitesEvent: EmitServerInvitesEvent
}

export const finalizeResourceInviteFactory =
  (deps: FinalizeResourceInviteFactoryDeps): FinalizeInvite =>
  async (params) => {
    const {
      findInvite,
      validateInvite,
      processInvite,
      deleteInvitesByTarget,
      insertInviteAndDeleteOld,
      emitServerInvitesEvent
    } = deps
    const { finalizerUserId, accept, token, resourceType } = params

    const invite = await findInvite({
      token,
      target: buildUserTarget(finalizerUserId),
      resourceFilter: resourceType ? { resourceType } : undefined
    })
    if (!invite) {
      throw new NoInviteFoundError(
        'Attempted to finalize nonexistant resource invite',
        {
          info: params
        }
      )
    }

    await validateInvite({
      invite,
      finalizerUserId,
      accept
    })

    // Delete invites first, so that any subscriptions fired by processInvite
    // don't return the invite back to the frontend
    await deleteInvitesByTarget(
      buildUserTarget(finalizerUserId),
      invite.resource.resourceType,
      invite.resource.resourceId
    )

    // Process invite
    try {
      await processInvite({
        invite,
        finalizerUserId,
        accept
      })
    } catch (e) {
      // If the invite finalization fails, re-insert the invite
      await insertInviteAndDeleteOld(invite).catch(noop)

      throw new InviteFinalizingError('Failed to process invite', {
        cause: ensureError(e),
        info: {
          finalizerUserId,
          accept,
          invite
        }
      })
    }

    await emitServerInvitesEvent({
      eventName: ServerInvitesEvents.Finalized,
      payload: {
        invite,
        accept,
        finalizerUserId
      }
    })
  }

// /**
//  * Accept or decline a stream invite
//  */
// export const finalizeStreamInviteFactory =
//   ({
//     findStreamInvite,
//     deleteInvitesByTarget,
//     findResource
//   }: {
//     findStreamInvite: FindStreamInvite
//     deleteInvitesByTarget: DeleteInvitesByTarget
//     findResource: FindResource
//   }): FinalizeStreamInvite =>
//   async (accept, streamId, token, userId) => {
//     const invite = await findStreamInvite(streamId, {
//       token,
//       target: buildUserTarget(userId)
//     })
//     if (!invite) {
//       throw new NoInviteFoundError('Attempted to finalize nonexistant stream invite', {
//         info: {
//           streamId,
//           token,
//           userId
//         }
//       })
//     }

//     const stream = await findResource(invite)
//     if (!stream) {
//       throw new StreamNotFoundError('Stream not found for invite', {
//         info: {
//           streamId,
//           token,
//           userId
//         }
//       })
//     }

//     // Delete all invites to this stream
//     // We're doing this before processing the invite, to prevent a PROJECT UPDATED event
//     // from being fired with the invites still attached
//     await deleteInvitesByTarget(
//       buildUserTarget(userId)!,
//       ResourceTargets.Streams,
//       streamId
//     )

//     // Invite found - accept or decline
//     if (accept) {
//       // Add access for user
//       const { role = Roles.Stream.Contributor, inviterId } = invite
//       // TODO: check role nullability
//       await addOrUpdateStreamCollaborator(streamId, userId, role!, inviterId, null, {
//         fromInvite: true
//       })
//     } else {
//       await addStreamInviteDeclinedActivity({
//         streamId,
//         inviteTargetId: userId,
//         inviterId: invite.inviterId,
//         stream
//       })
//     }
//   }

// /**
//  * Cancel/decline a stream invite
//  * TODO: What's the difference between this and finalizeStreamInvite? Canceled by owner maybe?
//  */
// export const cancelStreamInviteFactory =
//   ({
//     findStreamInvite,
//     deleteStreamInvite
//   }: {
//     findStreamInvite: FindStreamInvite
//     deleteStreamInvite: DeleteStreamInvite
//   }) =>
//   async (streamId: string, inviteId: string) => {
//     const invite = await findStreamInvite(streamId, {
//       inviteId
//     })
//     if (!invite) {
//       throw new NoInviteFoundError('Attempted to process nonexistant stream invite', {
//         info: {
//           streamId,
//           inviteId
//         }
//       })
//     }
//     await deleteStreamInvite(invite.id)
//   }

// /**
//  * Re-send pending invite e-mail, without creating a new invite
//  * TODO: WHy? Use creation factory thing instead
//  */
// export const resendInviteFactory =
//   ({
//     findInvite,
//     resendInviteEmail
//   }: {
//     resendInviteEmail: ResendInviteEmail
//     findInvite: FindInvite
//   }) =>
//   async (inviteId: string) => {
//     const invite = await findInvite(inviteId)
//     if (!invite) {
//       throw new NoInviteFoundError('Attempted to re-send a nonexistant invite')
//     }
//     await resendInviteEmail(invite)
//   }

/**
 * Delete pending invite
 * TODO: Differnece between this and cancel?
 */
export const deleteInviteFactory =
  ({
    findInvite,
    deleteInvite
  }: {
    findInvite: FindInvite
    deleteInvite: DeleteInvite
  }) =>
  async (inviteId: string) => {
    const invite = await findInvite(inviteId)
    if (!invite) {
      throw new NoInviteFoundError('Attempted to delete a nonexistant invite')
    }

    await deleteInvite(invite.id)
  }
