import crs from 'crypto-random-string'
import { PasswordResetTokens } from '@/modules/core/dbSchema'
import { StringChain } from 'lodash'
import dayjs from 'dayjs'
import { InvalidArgumentError } from '@/modules/shared/errors'

export type PasswordResetTokenRecord = {
  id: string
  email: string
  createdAt: StringChain
}

export type EmailOrTokenId = { email?: string; tokenId?: string }

const baseQuery = (identity: EmailOrTokenId) => {
  const { email, tokenId } = identity
  if (!email && !tokenId)
    throw new InvalidArgumentError(
      'Either the email address or token ID must be specified'
    )

  const q = PasswordResetTokens.knex<PasswordResetTokenRecord>()
  if (email) {
    q.where(PasswordResetTokens.col.email, email)
  } else {
    q.where(PasswordResetTokens.col.id, tokenId)
  }

  return q
}

/**
 * Attempt to find a valid & pending password reset token that was created in the last hour
 */
export async function getPendingToken(identity: EmailOrTokenId) {
  const anHourAgo = dayjs().subtract(1, 'hour')

  const record = await baseQuery(identity)
    .andWhere(PasswordResetTokens.col.createdAt, '>', anHourAgo.toISOString())
    .first()

  return record
}

/**
 * Delete all tokens that fit the specified identity
 */
export async function deleteTokens(identity: EmailOrTokenId) {
  await baseQuery(identity).del()
}

/**
 * Delete old tokens and create new one
 */
export async function createToken(email: string) {
  if (!email) throw new InvalidArgumentError('E-mail address is empty')

  await deleteTokens({ email })
  const data: PasswordResetTokenRecord[] = await PasswordResetTokens.knex().insert(
    {
      id: crs({ length: 10 }),
      email
    },
    Object.values(PasswordResetTokens.with({ withoutTablePrefix: true }).col)
  )

  return data[0]
}
