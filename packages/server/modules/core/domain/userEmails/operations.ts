import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { Optional } from '@speckle/shared'
import { Knex } from 'knex'

/**
 * Validate and insert new user email
 */
export type ValidateAndCreateUserEmail = (params: {
  userEmail: Pick<UserEmail, 'email' | 'userId'> & {
    primary?: boolean
    verified?: boolean
  }
}) => Promise<UserEmail>

export type EnsureNoPrimaryEmailForUser = (params: { userId: string }) => Promise<void>

/**
 * Insert new user email (no validation)
 */
export type CreateUserEmail = ({
  userEmail
}: {
  userEmail: Pick<UserEmail, 'email' | 'userId'> & {
    primary?: boolean
    verified?: boolean
  }
}) => Promise<UserEmail>

export type UpdateUserEmail = (
  {
    query,
    update
  }: {
    query:
      | (Pick<UserEmail, 'id' | 'userId'> & { primary?: boolean; verified?: boolean })
      | (Pick<UserEmail, 'email'> & { primary?: boolean })
      | (Pick<UserEmail, 'userId'> & { primary: true })
    update: Pick<Partial<UserEmail>, 'email' | 'primary' | 'verified'>
  },
  options?: { trx: Knex.Transaction }
) => Promise<Optional<UserEmail>>

export type DeleteUserEmail = (
  userEmail: Pick<UserEmail, 'id' | 'userId'>
) => Promise<boolean>

export type MarkUserEmailAsVerified = ({
  email
}: {
  email: string
}) => Promise<Optional<UserEmail>>

export type FindPrimaryEmailForUser = (
  query:
    | {
        userId: string
      }
    | { email: string }
) => Promise<Optional<UserEmail>>

export type FindEmail = (query: Partial<UserEmail>) => Promise<Optional<UserEmail>>

export type FindEmailsByUserId = ({
  userId
}: Pick<Partial<UserEmail>, 'userId'>) => Promise<UserEmail[]>

export type FindVerifiedEmailsByUserId = ({
  userId
}: Pick<UserEmail, 'userId'>) => Promise<UserEmail[]>

export type FindVerifiedEmailByUserIdAndDomain = ({
  userId,
  domain
}: Pick<UserEmail, 'userId'> & { domain: string }) => Promise<UserEmail | null>

export type CountEmailsByUserId = ({
  userId
}: Pick<UserEmail, 'userId'>) => Promise<number>

export type SetPrimaryUserEmail = ({
  id,
  userId
}: Pick<UserEmail, 'id' | 'userId'>) => Promise<boolean>
