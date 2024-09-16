import crs from 'crypto-random-string'
import { PasswordResetTokens } from '@/modules/core/dbSchema'
import { StringChain } from 'lodash'
import dayjs from 'dayjs'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Knex } from 'knex'
import {
  CreateToken,
  DeleteTokens,
  EmailOrTokenId,
  GetPendingToken
} from '@/modules/pwdreset/domain/operations'

export type PasswordResetTokenRecord = {
  id: string
  email: string
  createdAt: StringChain
}

const tables = {
  pwdresetTokens: (db: Knex) => db<PasswordResetTokenRecord>(PasswordResetTokens.name)
}

const baseQueryFactory = (deps: { db: Knex }) => (identity: EmailOrTokenId) => {
  const { email, tokenId } = identity
  if (!email && !tokenId)
    throw new InvalidArgumentError(
      'Either the email address or token ID must be specified'
    )

  const q = tables.pwdresetTokens(deps.db)
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
export const getPendingTokenFactory =
  (deps: { db: Knex }): GetPendingToken =>
  async (identity: EmailOrTokenId) => {
    const anHourAgo = dayjs().subtract(1, 'hour')

    const record = await baseQueryFactory(deps)(identity)
      .andWhere(PasswordResetTokens.col.createdAt, '>', anHourAgo.toISOString())
      .first()

    return record
  }

/**
 * Delete all tokens that fit the specified identity
 */
export const deleteTokensFactory =
  (deps: { db: Knex }): DeleteTokens =>
  async (identity: EmailOrTokenId) => {
    const q = baseQueryFactory(deps)
    await q(identity).del()
  }

/**
 * Delete old tokens and create new one
 */
export const createTokenFactory =
  (deps: { db: Knex }): CreateToken =>
  async (email: string) => {
    if (!email) throw new InvalidArgumentError('E-mail address is empty')

    await deleteTokensFactory(deps)({ email })

    const data: PasswordResetTokenRecord[] = await tables
      .pwdresetTokens(deps.db)
      .insert(
        {
          id: crs({ length: 10 }),
          email
        },
        '*'
      )

    return data[0]
  }
