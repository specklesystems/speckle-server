import { DeleteExistingUserAuthTokens } from '@/modules/auth/domain/operations'
import {
  ChangeUserPassword,
  GetUserByEmail
} from '@/modules/core/domain/users/operations'
import { DeleteTokens, GetPendingToken } from '@/modules/pwdreset/domain/operations'
import { PasswordRecoveryFinalizationError } from '@/modules/pwdreset/errors'

type InitializeStateDeps = {
  getUserByEmail: GetUserByEmail
  getPendingToken: GetPendingToken
}

const initializeStateFactory =
  (deps: InitializeStateDeps) => async (tokenId: string, password: string) => {
    if (!tokenId && !password)
      throw new PasswordRecoveryFinalizationError(
        'Both the token & password must be set'
      )

    const token = await deps.getPendingToken({ tokenId })
    if (!token)
      throw new PasswordRecoveryFinalizationError(
        'Invalid reset token, it may be expired'
      )

    const user = await deps.getUserByEmail(token.email)
    if (!user) {
      throw new PasswordRecoveryFinalizationError('Invalid finalization request')
    }

    return { tokenId, password, token, user }
  }

type FinalizationState = Awaited<ReturnType<ReturnType<typeof initializeStateFactory>>>

type FinalizeNewPasswordDeps = {
  deleteTokens: DeleteTokens
  updateUserPassword: ChangeUserPassword
  deleteExistingAuthTokens: DeleteExistingUserAuthTokens
}

const finalizeNewPasswordFactory =
  (deps: FinalizeNewPasswordDeps) => async (state: FinalizationState) => {
    const { user, password, tokenId } = state
    await deps.updateUserPassword({ id: user.id, newPassword: password })

    // Delete password reset tokens
    await Promise.all([
      deps.deleteTokens({ tokenId }),
      deps.deleteTokens({ email: user.email })
    ])

    // Delete existing auth tokens
    await deps.deleteExistingAuthTokens(user.id)
  }

/**
 * Attempt to finalize an initiated password recovery flow
 */
export const finalizePasswordResetFactory =
  (deps: InitializeStateDeps & FinalizeNewPasswordDeps) =>
  async (tokenId: string, password: string) => {
    const state = await initializeStateFactory(deps)(tokenId, password)
    await finalizeNewPasswordFactory(deps)(state)
  }
