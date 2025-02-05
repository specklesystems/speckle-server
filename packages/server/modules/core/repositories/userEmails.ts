import { Knex } from 'knex'
import crs from 'crypto-random-string'
import {
  CountEmailsByUserId,
  CreateUserEmail,
  DeleteUserEmail,
  EnsureNoPrimaryEmailForUser,
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
  UserEmailPrimaryAlreadyExistsError,
  UserEmailPrimaryUnverifiedError
} from '@/modules/core/errors/userEmails'
import { get, omit } from 'lodash'

const whereEmailIs = (query: Knex.QueryBuilder, email: string) => {
  query.whereRaw('lower("email") = lower(?)', [email])
}

export const ensureNoPrimaryEmailForUserFactory =
  ({ db }: { db: Knex }): EnsureNoPrimaryEmailForUser =>
  async ({ userId }) => {
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

    const [row] = await db<UserEmail>(UserEmails.name).insert(
      {
        id,
        email: email.toLowerCase().trim(),
        ...rest
      },
      '*'
    )

    return row
  }

export const updateUserEmailFactory =
  ({ db }: { db: Knex }): UpdateUserEmail =>
  async ({ query, update }) => {
    const queryWithUserId = query as Pick<UserEmail, 'userId'>
    if (queryWithUserId.userId && update.primary) {
      await ensureNoPrimaryEmailForUserFactory({ db })(queryWithUserId)
    }
    const q = db<UserEmail>(UserEmails.name)
      .where(omit(query, ['email']))
      .update(
        {
          ...update,
          ...(update.email?.length ? { email: update.email.toLowerCase() } : {})
        },
        '*'
      )

    if ('email' in query && query.email?.length) {
      whereEmailIs(q, query.email)
    }

    const [updated] = await q
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
    if (!get(query, 'userId') && !get(query, 'email')) return undefined

    const q = db<UserEmail>(UserEmails.name)
      .where({
        ...omit(query, ['email']),
        primary: true
      })
      .first()

    if ('email' in query && query.email?.length) {
      whereEmailIs(q, query.email)
    }

    return await q
  }

export const findEmailFactory =
  ({ db }: { db: Knex }): FindEmail =>
  async (query) => {
    if (!Object.values(query).length) return undefined

    const q = db<UserEmail>(UserEmails.name)
      .where(omit(query, ['email']))
      .first()

    if (query.email?.length) {
      whereEmailIs(q, query.email)
    }

    return await q
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
      const updated = await updateUserEmailFactory({ db: trx })({
        query: { id, userId, verified: true },
        update: { primary: true }
      })
      if (!updated) {
        throw new UserEmailPrimaryUnverifiedError()
      }
    })
    return true
  }

export const findVerifiedEmailsByUserIdFactory =
  ({ db }: { db: Knex }): FindEmailsByUserId =>
  async ({ userId }) => {
    return db(UserEmails.name).where({
      [UserEmails.col.userId]: userId,
      [UserEmails.col.verified]: true
    })
  }
