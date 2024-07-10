import { MarkUserEmailAsVerified, UpdateUserEmail } from '../domain/operations'

export const markUserEmailAsVerifiedFactory =
  ({
    updateUserEmail
  }: {
    updateUserEmail: UpdateUserEmail
  }): MarkUserEmailAsVerified =>
  async (email) =>
    updateUserEmail({ email }, { verified: true })
