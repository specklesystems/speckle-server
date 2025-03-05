import { Users } from '@/modules/core/dbSchema'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { SetUserActiveWorkspace } from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'

export const setUserActiveWorkspaceFactory =
  (deps: { db: Knex }): SetUserActiveWorkspace =>
  async ({ userId, workspaceSlug, isProjectsActive = false }) => {
    const meta = metaHelpers(Users, deps.db)
    await Promise.all([
      meta.set(userId, 'activeWorkspace', workspaceSlug),
      meta.set(userId, 'isProjectsActive', isProjectsActive)
    ])
  }
