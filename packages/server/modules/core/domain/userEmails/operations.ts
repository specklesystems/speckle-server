import { UserEmail } from '@/modules/core/domain/userEmails/types'

export type CreateUserEmail = ({
  userEmail
}: {
  userEmail: Pick<UserEmail, 'email' | 'userId'> & { primary?: boolean }
}) => Promise<string>

export type UpdateUserEmail = ({
  query,
  update
}: {
  query:
    | (Pick<UserEmail, 'email'> & { primary?: boolean })
    | (Pick<UserEmail, 'userId'> & { primary: true })
  update: Pick<Partial<UserEmail>, 'email' | 'primary' | 'verified'>
}) => Promise<UserEmail>

export type DeleteUserEmail = ({
  userId,
  email
}: {
  userId: string
  email: string
}) => Promise<boolean>

export type MarkUserEmailAsVerified = ({
  email
}: {
  email: string
}) => Promise<UserEmail>

export type FindPrimaryEmailForUser = (
  query:
    | {
        userId: string
      }
    | { email: string }
) => Promise<UserEmail>

export type FindEmail = (query: Partial<UserEmail>) => Promise<UserEmail>
