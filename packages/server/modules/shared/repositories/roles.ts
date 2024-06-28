import { GetRoles, UpsertRole } from '@/modules/shared/domain/rolesAndScopes/operations'
import { UserRole } from '@/modules/shared/domain/rolesAndScopes/types'
import { Knex } from 'knex'

let roles: UserRole[]

export const getRolesFactory =
  ({ db }: { db: Knex }): GetRoles =>
  async () => {
    if (roles) return roles
    roles = await db('user_roles').select('*')
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
