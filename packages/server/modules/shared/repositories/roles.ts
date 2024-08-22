import { GetRoles, UpsertRole } from '@/modules/shared/domain/rolesAndScopes/operations'
import { UserRole } from '@/modules/shared/domain/rolesAndScopes/types'
import { Knex } from 'knex'
import { DatabaseError } from '@/modules/shared/errors'

let roles: UserRole[]

export const getRolesFactory =
  ({ db }: { db: Knex }): GetRoles =>
  async () => {
    if (roles) return roles
    try {
      roles = await db('user_roles').select('*')
    } catch (e) {
      if (e instanceof Error)
        throw new DatabaseError(
          'Database error occurred while attempting to get Roles',
          { cause: e }
        )
    }
    return roles
  }

export const registerOrUpdateRole =
  ({ db }: { db: Knex }): UpsertRole =>
  async ({ role }) => {
    await db('user_roles')
      .insert(role)
      .onConflict('name')
      .merge(['weight', 'description', 'resourceTarget'])
  }
