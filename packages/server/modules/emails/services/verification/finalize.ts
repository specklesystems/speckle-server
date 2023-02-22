import { markUserAsVerified } from '@/modules/core/repositories/users'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { deleteVerifications, getPendingToken } from '@/modules/emails/repositories'

async function initializeState(tokenId: string) {
  if (!tokenId)
    throw new EmailVerificationFinalizationError('Missing verification token')

  const token = await getPendingToken({ token: tokenId })
  if (!token)
    throw new EmailVerificationFinalizationError(
      'Invalid or expired verification token'
    )

  return { token }
}

type FinalizationState = Awaited<ReturnType<typeof initializeState>>

async function finalizeVerification(state: FinalizationState) {
  const { token } = state
  const { email } = token

  await Promise.all([markUserAsVerified(email), deleteVerifications(email)])
}

/**
 * Finalize the email verification process
 */
export async function finalizeEmailVerification(tokenId: string) {
  const state = await initializeState(tokenId)
  await finalizeVerification(state)
}
