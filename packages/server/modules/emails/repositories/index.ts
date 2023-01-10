import { EmailVerifications } from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'

export type EmailVerificationRecord = {
  id: string
  email: string
  createdAt: Date
}

/**
 * Attempt to find a valid & pending token entry for email verification
 */
export async function getPendingToken(params: { token?: string; email?: string }) {
  const { token, email } = params
  if (!token && !email) throw new InvalidArgumentError('Token & email is empty')

  const aWeekAgo = dayjs().subtract(1, 'week')

  const q = EmailVerifications.knex<EmailVerificationRecord>()
    .where(EmailVerifications.col.createdAt, '>', aWeekAgo.toISOString())
    .first()

  if (token) {
    q.andWhere(EmailVerifications.col.id, token)
  } else {
    q.andWhere(EmailVerifications.col.email, email)
  }

  return await q
}

export async function deleteVerifications(email: string) {
  if (!email) throw new InvalidArgumentError('E-mail address is empty')
  const q = EmailVerifications.knex().where(EmailVerifications.col.email, email).del()
  await q
}

/**
 * Delete all previous verification entries and create a new one
 */
export async function deleteOldAndInsertNewVerification(email: string) {
  if (!email) throw new InvalidArgumentError('E-mail address is empty')

  // delete all existing verifications first
  await deleteVerifications(email)

  // insert new one
  const EmailVerificationCols = EmailVerifications.with({
    withoutTablePrefix: true
  }).col

  const newId = cryptoRandomString({ length: 20 })
  await EmailVerifications.knex().insert({
    [EmailVerificationCols.id]: newId,
    [EmailVerificationCols.email]: email
  })

  return newId
}
