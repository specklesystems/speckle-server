import { Knex } from 'knex'
import crs from 'crypto-random-string'
import {
  CountEmailsByUserId,
  CreateUserEmail,
  DeleteUserEmail,
  FindEmail,
  FindEmailsByUserId,
  FindPrimaryEmailForUser,
  SetPrimaryUserEmail,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { UserEmails } from '@/modules/core/dbSchema'
import {
  UserEmailDeleteError,
  UserEmailPrimaryAlreadyExistsError
} from '@/modules/core/errors/userEmails'

const checkPrimaryEmail =
  ({ db }: { db: Knex }) =>
  async ({ userId }: { userId: string }) => {
    const primaryEmail = await findPrimaryEmailForUserFactory({ db })({ userId })
    if (primaryEmail) {
      throw new UserEmailPrimaryAlreadyExistsError()
    }
  }

export const createUserEmailFactory =
  ({ db }: { db: Knex }): CreateUserEmail =>
  async ({ userEmail }) => {
    const id = crs({ length: 10 })
    const { email, ...rest } = userEmail

    if (rest.primary) {
      await checkPrimaryEmail({ db })(rest)
    }

    await db(UserEmails.name).insert({
      id,
      primary: true,
      email: email.toLowerCase().trim(),
      ...rest
    })

    return id
  }

export const updateUserEmailFactory =
  ({ db }: { db: Knex }): UpdateUserEmail =>
  async ({ query, update }) => {
    const queryWithUserId = query as Pick<UserEmail, 'userId'>
    if (queryWithUserId.userId && update.primary) {
      await checkPrimaryEmail({ db })(queryWithUserId)
    }
    const [updated] = await db<UserEmail>(UserEmails.name)
      .where(query)
      .update(update, '*')

    return updated
  }

const countEmailsByUserIdFactory =
  ({ db }: { db: Knex }): CountEmailsByUserId =>
  async ({ userId }) => {
    const [res] = await db(UserEmails.name)
      .where({
        [UserEmails.col.userId]: userId
      })
      .count()
    return parseInt(res.count.toString() || '0')
  }

export const deleteUserEmailFactory =
  ({ db }: { db: Knex }): DeleteUserEmail =>
  async ({ id, userId }) => {
    const emailsCount = await countEmailsByUserIdFactory({ db })({ userId })
    if (emailsCount === 1) {
      throw new UserEmailDeleteError('Cannot delete last user email')
    }

    const isPrimaryEmail = !!(await findEmailFactory({ db })({ id, primary: true }))
    if (isPrimaryEmail) {
      throw new UserEmailDeleteError('Cannot delete primary email')
    }

    await db(UserEmails.name).where({ id, userId }).delete()
    return true
  }

export const findPrimaryEmailForUserFactory =
  ({ db }: { db: Knex }): FindPrimaryEmailForUser =>
  async (query) => {
    return db(UserEmails.name)
      .where({
        ...query,
        primary: true
      })
      .first()
  }

export const findEmailFactory =
  ({ db }: { db: Knex }): FindEmail =>
  async (query) => {
    return db(UserEmails.name)
      .where({
        ...query
      })
      .first()
  }

export const findEmailsByUserIdFactory =
  ({ db }: { db: Knex }): FindEmailsByUserId =>
  async ({ userId }) => {
    if (!userId) return []
    return db(UserEmails.name).where({
      [UserEmails.col.userId]: userId
    })
  }

export const setPrimaryUserEmailFactory =
  ({ db }: { db: Knex }): SetPrimaryUserEmail =>
  async ({ id, userId }) => {
    await db.transaction(async (trx) => {
      await updateUserEmailFactory({ db: trx })({
        query: { userId, primary: true },
        update: { primary: false }
      })
      await updateUserEmailFactory({ db: trx })({
        query: { id, userId },
        update: { primary: true }
      })
    })
    return true
  }
