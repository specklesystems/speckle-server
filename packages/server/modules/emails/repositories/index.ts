import { EmailVerifications } from '@/modules/core/dbSchema'
import {
  DeleteOldAndInsertNewVerification,
  DeleteVerifications,
  GetPendingToken,
  GetPendingVerificationByEmail
} from '@/modules/emails/domain/operations'
import { InvalidArgumentError } from '@/modules/shared/errors'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import { Knex } from 'knex'
import { hash } from 'bcrypt'
import { EmailVerification } from '@/modules/emails/domain/types'

const tables = {
  emailVerifications: (db: Knex) => db<EmailVerification>(EmailVerifications.name)
}

const hashEmailVerificationCode = async (code: string) => hash(code, 10)

export type EmailVerificationRecord = {
  id: string
  email: string
  createdAt: Date
}

/**
 * Attempt to find a valid & pending token entry for email verification
 */
export const getPendingTokenFactory =
  (deps: { db: Knex }): GetPendingToken =>
  async ({ token, email }) => {
    if (!token && !email) throw new InvalidArgumentError('Token & email is empty')

    const aWeekAgo = dayjs().subtract(1, 'week')

    const q = tables
      .emailVerifications(deps.db)
      .where(EmailVerifications.col.createdAt, '>', aWeekAgo.toISOString())
      .first()

    if (token) {
      q.andWhere(EmailVerifications.col.id, token)
    } else {
      q.andWhere(EmailVerifications.col.email, email)
    }

    return await q
  }

export const deleteVerificationsFactory =
  (deps: { db: Knex }): DeleteVerifications =>
  async (email) => {
    if (!email) throw new InvalidArgumentError('E-mail address is empty')
    const q = tables
      .emailVerifications(deps.db)
      .where(EmailVerifications.col.email, email)
      .del()
    await q
  }

function generateEmailVerificationCode() {
  return cryptoRandomString({ length: 6, type: 'numeric' })
}

/**
 * Delete all previous verification entries and create a new one
 */
export const deleteOldAndInsertNewVerificationFactory =
  (deps: { db: Knex }): DeleteOldAndInsertNewVerification =>
  async (email) => {
    if (!email) throw new InvalidArgumentError('E-mail address is empty')

    // delete all existing verifications first
    await deleteVerificationsFactory({ db: deps.db })(email)

    // insert new one
    const EmailVerificationCols = EmailVerifications.with({
      withoutTablePrefix: true
    }).col

    const code = generateEmailVerificationCode()
    await tables.emailVerifications(deps.db).insert({
      [EmailVerificationCols.id]: cryptoRandomString({ length: 20 }),
      [EmailVerificationCols.email]: email,
      [EmailVerificationCols.code]: await hashEmailVerificationCode(code)
    })

    return code
  }

export const getPendingVerificationByEmailFactory =
  ({
    db,
    verificationTimeoutMinutes
  }: {
    db: Knex
    verificationTimeoutMinutes: number
  }): GetPendingVerificationByEmail =>
  async ({ email }) => {
    return await tables
      .emailVerifications(db)
      .where(EmailVerifications.col.email, email)
      .where(
        EmailVerifications.col.createdAt,
        '>',
        dayjs().subtract(verificationTimeoutMinutes, 'minutes').toISOString()
      )
      .orderBy(EmailVerifications.col.createdAt, 'desc')
      .first()
  }
