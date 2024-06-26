import { TokenScopeData } from '@/modules/shared/domain/rolesAndScopes/types'
import { Knex } from 'knex'

export const registerOrUpdateScopeFactory =
  ({ db }: { db: Knex }) =>
  async ({ scope }: { scope: TokenScopeData }) => {
    await db('scopes').insert(scope).onConflict('name').merge(['public', 'description'])
  }
