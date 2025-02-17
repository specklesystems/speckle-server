import {
  CreateUserEmail,
  FindEmail,
  ValidateAndCreateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { ensureNoPrimaryEmailForUserFactory } from '@/modules/core/repositories/userEmails'
import { UserEmailAlreadyExistsError } from '@/modules/core/errors/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { RequestNewEmailVerification } from '@/modules/emails/domain/operations'

export const validateAndCreateUserEmailFactory =
  (deps: {
    createUserEmail: CreateUserEmail
    ensureNoPrimaryEmailForUser: ReturnType<typeof ensureNoPrimaryEmailForUserFactory>
    findEmail: FindEmail
    updateEmailInvites: ReturnType<typeof finalizeInvitedServerRegistrationFactory>
    requestNewEmailVerification: RequestNewEmailVerification
  }): ValidateAndCreateUserEmail =>
  async (params) => {
    const { userEmail } = params
    const { email, userId, primary } = userEmail

    const validationPromises: Array<Promise<unknown>> = []

    if (primary) {
      validationPromises.push(deps.ensureNoPrimaryEmailForUser({ userId }))
    }

    validationPromises.push(
      (async () => {
        const existingEmail = await deps.findEmail({
          email
        })
        if (existingEmail) {
          throw new UserEmailAlreadyExistsError()
        }
      })()
    )

    await Promise.all(validationPromises)

    const result = await deps.createUserEmail({ userEmail })

    // Update all invites referencing the email, to point to the user
    await deps.updateEmailInvites(result.email, result.userId)

    // Request email verification (if needed)
    if (!userEmail.verified) {
      await deps.requestNewEmailVerification(result.id)
    }

    return result
  }
