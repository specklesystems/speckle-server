import type {
  GetRoles,
  UpsertRole
} from '@/modules/shared/domain/rolesAndScopes/operations'
import type { UserRole } from '@/modules/shared/domain/rolesAndScopes/types'
import type { Knex } from 'knex'
import { DatabaseError } from '@/modules/shared/errors'
import { UserRoles } from '@/modules/core/dbSchema'
import {
  appConstantValueCacheProviderFactory,
  wrapFactoryWithCache
} from '@/modules/shared/utils/caching'
import { TIME_MS } from '@speckle/shared'

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
          db,
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

export const getCachedRolesFactory = wrapFactoryWithCache({
  factory: getRolesFactory,
  name: 'modules/shared/repositories/roles::getCachedRolesFactory',
  cacheProvider: appConstantValueCacheProviderFactory(),
  ttlMs: 1 * TIME_MS.hour
})
