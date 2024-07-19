import {
  MarkUserEmailAsVerified,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'

export const markUserEmailAsVerifiedFactory =
  ({
    updateUserEmail
  }: {
    updateUserEmail: UpdateUserEmail
  }): MarkUserEmailAsVerified =>
  async ({ email }) =>
    updateUserEmail({ query: { email }, update: { verified: true } })
