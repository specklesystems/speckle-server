import { deleteExistingAuthTokens } from '@/modules/auth/repositories'
import { getUserByEmail } from '@/modules/core/repositories/users'
import { updateUserPassword } from '@/modules/core/services/users'
import { PasswordRecoveryFinalizationError } from '@/modules/pwdreset/errors'
import { deleteTokens, getPendingToken } from '@/modules/pwdreset/repositories'

async function initializeState(tokenId: string, password: string) {
  if (!tokenId && !password)
    throw new PasswordRecoveryFinalizationError('Both the token & password must be set')

  const token = await getPendingToken({ tokenId })
  if (!token)
    throw new PasswordRecoveryFinalizationError(
      'Invalid reset token, it may be expired'
    )

  const user = await getUserByEmail(token.email)
  if (!user) {
    throw new PasswordRecoveryFinalizationError('Invalid finalization request')
  }

  return { tokenId, password, token, user }
}

type FinalizationState = Awaited<ReturnType<typeof initializeState>>

async function finalizeNewPassword(state: FinalizationState) {
  const { user, password, tokenId } = state
  await updateUserPassword({ id: user.id, newPassword: password })

  // Delete password reset tokens
  await Promise.all([deleteTokens({ tokenId }), deleteTokens({ email: user.email })])

  // Delete existing auth tokens
  await deleteExistingAuthTokens(user.id)
}

/**
 * Attempt to finalize an initiated password recovery flow
 */
export async function finalizePasswordReset(tokenId: string, password: string) {
  const state = await initializeState(tokenId, password)
  await finalizeNewPassword(state)
}
