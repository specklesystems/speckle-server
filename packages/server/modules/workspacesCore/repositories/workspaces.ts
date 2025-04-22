import {
  GetTotalWorkspaceCountFactory,
  GetUserWorkspaceCountFactory
} from '@/modules/workspacesCore/domain/operations'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import {
  WorkspaceAcl as WorkspaceAclDb,
  Workspaces
} from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const tables = {
  workspaces: (db: Knex) => db<Workspace>(Workspaces.name),
  workspaceAcl: (db: Knex) => db<WorkspaceAcl>(WorkspaceAclDb.name)
}

export const getUserWorkspaceCountFactory =
  (deps: { db: Knex }): GetUserWorkspaceCountFactory =>
  async (params) => {
    const q = tables
      .workspaceAcl(deps.db)
      .countDistinct(WorkspaceAclDb.col.workspaceId)
      .where(WorkspaceAclDb.col.userId, params.userId)

    // knex types are off here
    const [{ count }] = (await q) as unknown as { count: string }[]
    return parseInt(count)
  }

export const getTotalWorkspaceCountFactory =
  (deps: { db: Knex }): GetTotalWorkspaceCountFactory =>
  async () => {
    const query = tables.workspaces(deps.db).count()
    const [{ count }] = await query

    return parseInt(count + '')
  }
