import {
  InviteCreateValidationError,
  InviteFinalizedForNewEmail,
  InviteFinalizingError,
  InviteNotFoundError
} from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  ResolvedTargetData,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'

import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import {
  DeleteInvite,
  DeleteInvitesByTarget,
  DeleteServerOnlyInvites,
  FindInvite,
  FindServerInvite,
  InsertInviteAndDeleteOld,
  UpdateAllInviteTargets
} from '@/modules/serverinvites/domain/operations'
import {
  CollectAndValidateResourceTargets,
  FinalizeInvite,
  FinalizeInvitedServerRegistration,
  InviteFinalizationAction,
  ProcessFinalizedResourceInvite,
  ResolveAuthRedirectPath,
  ValidateResourceInviteBeforeFinalization,
  ValidateServerInvite
} from '@/modules/serverinvites/services/operations'
import { ensureError, MaybeNullOrUndefined } from '@speckle/shared'
import { noop } from 'lodash'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import {
  FindEmail,
  ValidateAndCreateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { ServerInfo } from '@/modules/core/helpers/types'
import { GetUser } from '@/modules/core/domain/users/operations'
import { GetServerInfo } from '@/modules/core/domain/server/operations'

/**
 * Convert the initial validation function to a finalization validation function so same logic can be reused
 */
export const convertToFinalizationValidation = (params: {
  getUser: GetUser
  initialValidation: CollectAndValidateResourceTargets
  serverInfo: ServerInfo
}): ValidateResourceInviteBeforeFinalization => {
  return async ({ invite, action, finalizerUserId }) => {
    // If decline action, allow doing so without extra validation
    if (action === InviteFinalizationAction.DECLINE) {
      return
    }

    const [inviter, finalizerUser] = await Promise.all([
      params.getUser(invite.inviterId),
      params.getUser(finalizerUserId)
    ])
    if (!inviter) {
      throw new InviteFinalizingError('Inviter not found', {
        info: {
          invite
        }
      })
    }
    if (!finalizerUser) {
      throw new InviteFinalizingError('Finalizer not found', {
        info: {
          finalizerUserId
        }
      })
    }

    const target: ResolvedTargetData = {
      userId: finalizerUserId,
      userEmail: null
    }

    try {
      await params.initialValidation({
        input: {
          ...invite,
          primaryResourceTarget: invite.resource
        },
        inviter,
        inviterResourceAccessLimits: null,
        target,
        targetUser: finalizerUser,
        serverInfo: params.serverInfo,
        finalizingInvite: true
      })
    } catch (e) {
      if (!(e instanceof InviteCreateValidationError)) throw e
      throw new InviteFinalizingError(e.message, {
        info: { invite }
      })
    }
  }
}

/**
 * Resolve the relative auth redirect path, after registering with an invite
 * Note: Important auth query string params like the access_code are added separately
 * in auth middlewares
 */
export const resolveAuthRedirectPathFactory = (): ResolveAuthRedirectPath => () => {
  // All post-auth redirects are handled by the frontend itself
  return getFrontendOrigin()
}

/**
 * Validate that the new user has a valid invite for registering to the server
 */
export const validateServerInviteFactory =
  ({
    findServerInvite
  }: {
    findServerInvite: FindServerInvite
  }): ValidateServerInvite =>
  async (email?: string, token?: string): Promise<ServerInviteRecord> => {
    const invite = await findServerInvite(email, token)
    if (!invite) {
      throw new InviteNotFoundError(
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
  }): FinalizeInvitedServerRegistration =>
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
  emitEvent: EventBusEmit
  findEmail: FindEmail
  validateAndCreateUserEmail: ValidateAndCreateUserEmail
  collectAndValidateResourceTargets: CollectAndValidateResourceTargets
  getServerInfo: GetServerInfo
  getUser: GetUser
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
      emitEvent,
      findEmail,
      validateAndCreateUserEmail,
      collectAndValidateResourceTargets,
      getServerInfo,
      getUser
    } = deps
    const {
      finalizerUserId,
      accept,
      token,
      finalizerResourceAccessLimits,
      allowAttachingNewEmail,
      trueFinalizerId
    } = params

    const finalizerUserTarget = buildUserTarget(finalizerUserId)
    const invite = await findInvite({
      token
    })
    if (!invite) {
      throw new InviteNotFoundError('Attempted to finalize nonexistant invite', {
        info: params
      })
    }

    const inviteTarget = resolveTarget(invite.target)
    let isNewEmailTarget = !!inviteTarget.userEmail?.length
    if (isNewEmailTarget && allowAttachingNewEmail) {
      const existingEmail = await findEmail({ email: inviteTarget.userEmail! })
      if (existingEmail) {
        // This shouldn't really happen, but just in case
        isNewEmailTarget = false
      }
    }

    if (isNewEmailTarget) {
      if (!allowAttachingNewEmail) {
        throw new InviteFinalizedForNewEmail(
          InviteFinalizedForNewEmail.defaultMessage,
          {
            info: {
              finalizerUserId,
              invite
            }
          }
        )
      }
    } else {
      if (invite.target !== finalizerUserTarget) {
        throw new InviteFinalizingError('Attempted to finalize mismatched invite', {
          info: {
            finalizerUserId,
            invite
          }
        })
      }
    }

    const action = accept
      ? InviteFinalizationAction.ACCEPT
      : InviteFinalizationAction.DECLINE

    const validatorPayload: Parameters<typeof validateInvite>[0] = {
      invite,
      finalizerUserId,
      action,
      finalizerResourceAccessLimits
    }

    // First, repeat same validation we did when creating the invite
    // Then, do additional validation based on the finalization action, if there's any
    const coreValidator = convertToFinalizationValidation({
      initialValidation: collectAndValidateResourceTargets,
      serverInfo: await getServerInfo(),
      getUser
    })
    await Promise.all([
      coreValidator(validatorPayload),
      validateInvite(validatorPayload)
    ])

    // Delete invites first, so that any subscriptions fired by processInvite
    // don't return the invite back to the frontend
    await deleteInvitesByTarget(
      invite.target,
      invite.resource.resourceType,
      invite.resource.resourceId
    )

    try {
      // Add email
      if (isNewEmailTarget && action === InviteFinalizationAction.ACCEPT) {
        await validateAndCreateUserEmail({
          userEmail: {
            email: inviteTarget.userEmail!,
            userId: finalizerUserId,
            verified: true
          }
        })
      }

      // Process invite
      await processInvite({
        invite,
        finalizerUserId,
        action
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

    await emitEvent({
      eventName: ServerInvitesEvents.Finalized,
      payload: {
        invite,
        accept,
        finalizerUserId,
        trueFinalizerUserId: trueFinalizerId || finalizerUserId
      }
    })
  }

/**
 * Cancel invite. The difference between this and declining is that this action is invoked
 * by the invite creator, not by the invitee.
 */
export const cancelResourceInviteFactory =
  (deps: {
    findInvite: FindInvite
    validateResourceAccess: ValidateResourceInviteBeforeFinalization
    deleteInvite: DeleteInvite
    emitEvent: EventBusEmit
  }) =>
  async (params: {
    inviteId: string
    cancelerId: string
    cancelerResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }) => {
    const { findInvite, validateResourceAccess, deleteInvite, emitEvent } = deps
    const { inviteId, cancelerId, cancelerResourceAccessLimits } = params

    const invite = await findInvite({
      inviteId
    })
    if (!invite) {
      throw new InviteNotFoundError('Attempted to cancel nonexistant invite', {
        info: {
          ...params
        }
      })
    }

    await validateResourceAccess({
      invite,
      finalizerUserId: cancelerId,
      action: InviteFinalizationAction.CANCEL,
      finalizerResourceAccessLimits: cancelerResourceAccessLimits
    })
    await deleteInvite(invite.id)
    await emitEvent({
      eventName: ServerInvitesEvents.Canceled,
      payload: {
        invite,
        cancelerUserId: cancelerId
      }
    })
  }

/**
 * Delete pending invite - does no access checks!
 * (Used for admin invite delete currently)
 */
export const deleteInviteFactory =
  ({
    findInvite,
    deleteInvite,
    emitEvent
  }: {
    findInvite: FindInvite
    deleteInvite: DeleteInvite
    emitEvent: EventBusEmit
  }) =>
  async (inviteId: string, cancelerId: string) => {
    const invite = await findInvite({ inviteId })
    if (!invite) {
      throw new InviteNotFoundError('Attempted to delete a nonexistant invite')
    }

    await deleteInvite(invite.id)
    await emitEvent({
      eventName: ServerInvitesEvents.Canceled,
      payload: {
        invite,
        cancelerUserId: cancelerId
      }
    })
  }
