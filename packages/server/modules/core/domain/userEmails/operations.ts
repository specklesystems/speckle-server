import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { Knex } from 'knex'

export type CreateUserEmail = ({
  userEmail
}: {
  userEmail: Pick<UserEmail, 'email' | 'userId'> & { primary?: boolean }
}) => Promise<string>

export type UpdateUserEmail = (
  {
    query,
    update
  }: {
    query:
      | (Pick<UserEmail, 'id' | 'userId'> & { primary?: boolean })
      | (Pick<UserEmail, 'email'> & { primary?: boolean })
      | (Pick<UserEmail, 'userId'> & { primary: true })
    update: Pick<Partial<UserEmail>, 'email' | 'primary' | 'verified'>
  },
  { trx }: { trx: Knex.Transaction }
) => Promise<UserEmail>

export type DeleteUserEmail = (
  userEmail: Pick<UserEmail, 'id' | 'userId'>
) => Promise<boolean>

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

export type FindEmailsByUserId = ({
  userId
}: Pick<UserEmail, 'userId'>) => Promise<UserEmail[]>

export type CountEmailsByUserId = ({
  userId
}: Pick<UserEmail, 'userId'>) => Promise<number>

export type SetPrimaryUserEmail = ({
  id,
  userId
}: Pick<UserEmail, 'id' | 'userId'>) => Promise<boolean>
