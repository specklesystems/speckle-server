import { Optional } from '@speckle/shared'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import {
  DeleteVerifications,
  GetPendingToken
} from '@/modules/emails/domain/operations'
import { MarkUserAsVerified } from '@/modules/core/domain/users/operations'

type InitializeStateDeps = {
  getPendingToken: GetPendingToken
}

const initializeState =
  (deps: InitializeStateDeps) => async (tokenId: Optional<string>) => {
    if (!tokenId)
      throw new EmailVerificationFinalizationError('Missing verification token')

    const token = await deps.getPendingToken({ token: tokenId })
    if (!token)
      throw new EmailVerificationFinalizationError(
        'Invalid or expired verification token'
      )

    return { token }
  }

type FinalizationState = Awaited<ReturnType<ReturnType<typeof initializeState>>>

type FinalizeVerificationDeps = {
  markUserAsVerified: MarkUserAsVerified
  deleteVerifications: DeleteVerifications
}

const finalizeVerification =
  (deps: FinalizeVerificationDeps) => async (state: FinalizationState) => {
    const { token } = state
    const { email } = token

    await Promise.all([deps.markUserAsVerified(email), deps.deleteVerifications(email)])
  }

/**
 * Finalize the email verification process
 */
export const finalizeEmailVerificationFactory =
  (deps: InitializeStateDeps & FinalizeVerificationDeps) =>
  async (tokenId: Optional<string>) => {
    const state = await initializeState(deps)(tokenId)
    await finalizeVerification(deps)(state)
  }
