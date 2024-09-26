import { GetRoles, UpsertRole } from '@/modules/shared/domain/rolesAndScopes/operations'
import { UserRole } from '@/modules/shared/domain/rolesAndScopes/types'
import { Knex } from 'knex'
import { DatabaseError } from '@/modules/shared/errors'
import { UserRoles } from '@/modules/core/dbSchema'

let roles: UserRole[]

const tables = {
  userRoles: (db: Knex) => db<UserRole>(UserRoles.name)
}

export const getRolesFactory =
  ({ db }: { db: Knex }): GetRoles =>
  async () => {
    if (roles) return roles
    try {
      roles = await tables.userRoles(db).select('*')
    } catch (e) {
      if (e instanceof Error)
        throw new DatabaseError(
          'Database error occurred while attempting to get Roles',
          { cause: e }
        )
      throw e
    }
    return roles
  }

export const registerOrUpdateRole =
  ({ db }: { db: Knex }): UpsertRole =>
  async ({ role }) => {
    await tables
      .userRoles(db)
      .insert(role)
      .onConflict('name')
      .merge(['weight', 'description', 'resourceTarget'])
  }
