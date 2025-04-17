import {
  MarkUserEmailAsVerified,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import {
  DeleteVerifications,
  GetPendingVerificationByEmail
} from '@/modules/emails/domain/operations'
import { EmailVerificationFinalizationError } from '@/modules/emails/errors'
import { compare as compareHash } from 'bcrypt'

export const markUserEmailAsVerifiedFactory =
  ({
    updateUserEmail
  }: {
    updateUserEmail: UpdateUserEmail
  }): MarkUserEmailAsVerified =>
  async ({ email }) =>
    updateUserEmail({ query: { email }, update: { verified: true } })

export const verifyUserEmailFactory =
  ({
    getPendingVerificationByEmail,
    markUserEmailAsVerified,
    deleteVerifications
  }: {
    getPendingVerificationByEmail: GetPendingVerificationByEmail
    markUserEmailAsVerified: MarkUserEmailAsVerified
    deleteVerifications: DeleteVerifications
  }) =>
  async ({ email, code }: { email: string; code: string }) => {
    const userEmail = await getPendingVerificationByEmail({ email })

    if (!userEmail) throw new EmailVerificationFinalizationError()

    const isCodeValid = await compareHash(code, userEmail.code)

    if (!isCodeValid) throw new EmailVerificationFinalizationError()

    await markUserEmailAsVerified({ email })
    return await deleteVerifications(email)
  }
