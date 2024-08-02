import { Knex } from 'knex'
import crs from 'crypto-random-string'
import {
  CreateUserEmail,
  DeleteUserEmail,
  FindEmail,
  FindPrimaryEmailForUser,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { UserEmails } from '@/modules/core/dbSchema'

export const createUserEmailFactory =
  ({ db }: { db: Knex }): CreateUserEmail =>
  async ({ userEmail }) => {
    const id = crs({ length: 10 })
    const { email, ...rest } = userEmail

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
    const [updated] = await db<UserEmail>(UserEmails.name)
      .where(query)
      .update(update, '*')

    return updated
  }

export const deleteUserEmailFactory =
  ({ db }: { db: Knex }): DeleteUserEmail =>
  async ({ userId, email }) => {
    await db(UserEmails.name)
      .where({
        userId,
        email
      })
      .delete()

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
