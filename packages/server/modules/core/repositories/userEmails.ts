import { Knex } from 'knex'
import crs from 'crypto-random-string'
import {
  CreateUserEmail,
  DeleteUserEmail,
  UpdateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { USER_EMAILS_TABLE_NAME } from '@/modules/core/dbSchema'

export const createUserEmailFactory =
  ({ db }: { db: Knex }): CreateUserEmail =>
  async ({ userEmail }) => {
    const id = crs({ length: 10 })

    await db(USER_EMAILS_TABLE_NAME).insert({
      id,
      primary: true,
      ...userEmail
    })

    return id
  }

export const updateUserEmailFactory =
  ({ db }: { db: Knex }): UpdateUserEmail =>
  async ({ query, update }) => {
    const [updated] = await db<UserEmail>(USER_EMAILS_TABLE_NAME)
      .where(query)
      .update(update, '*')

    return updated
  }

export const deleteUserEmailFactory =
  ({ db }: { db: Knex }): DeleteUserEmail =>
  async ({ userId, email }) => {
    await db(USER_EMAILS_TABLE_NAME)
      .where({
        userId,
        email
      })
      .delete()

    return true
  }
