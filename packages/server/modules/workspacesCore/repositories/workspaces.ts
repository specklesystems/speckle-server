import type {
  CountWorkspaceUsers,
  GetTotalWorkspaceCountFactory,
  GetUserWorkspaceCountFactory,
  GetUserWorkspaceSeatsFactory,
  GetUserWorkspacesWithRole
} from '@/modules/workspacesCore/domain/operations'
import type {
  Workspace,
  WorkspaceAcl,
  WorkspaceSeat
} from '@/modules/workspacesCore/domain/types'
import {
  WorkspaceAcl as WorkspaceAclDb,
  Workspaces,
  WorkspaceSeats
} from '@/modules/workspacesCore/helpers/db'
import type { WorkspaceRoles } from '@speckle/shared'
import type { Knex } from 'knex'

const tables = {
  workspaces: (db: Knex) => db<Workspace>(Workspaces.name),
  workspaceAcl: (db: Knex) => db<WorkspaceAcl>(WorkspaceAclDb.name),
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>(WorkspaceSeats.name)
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

export const getUserWorkspacesWithRoleFactory =
  ({ db }: { db: Knex }): GetUserWorkspacesWithRole =>
  async (args) => {
    const workspaces = tables
      .workspaceAcl(db)
      .innerJoin(Workspaces.name, Workspaces.col.id, WorkspaceAclDb.col.workspaceId)
      .where(WorkspaceAclDb.col.userId, args.userId)
      .select<Array<Workspace & { role: WorkspaceRoles }>>([
        Workspaces.col,
        WorkspaceAclDb.col.role
      ])

    return await workspaces
  }

export const countWorkspaceUsersFactory =
  ({ db }: { db: Knex }): CountWorkspaceUsers =>
  async (args) => {
    const query = tables
      .workspaces(db)
      .innerJoin(WorkspaceAclDb.name, WorkspaceAclDb.col.workspaceId, Workspaces.col.id)
      .where(Workspaces.col.id, args.workspaceId)

    if (args.filter?.workspaceRole) {
      query.where(WorkspaceAclDb.col.role, args.filter.workspaceRole)
    }

    const [res] = await query.count()
    const count = parseInt(res.count.toString())
    return count
  }

export const getUserWorkspaceSeatsFactory =
  (deps: { db: Knex }): GetUserWorkspaceSeatsFactory =>
  async ({ userId }: { userId: string }) => {
    const workspaceSeats = await tables.workspaceSeats(deps.db).where({ userId })

    return workspaceSeats
  }

export const getTotalWorkspaceCountFactory =
  (deps: { db: Knex }): GetTotalWorkspaceCountFactory =>
  async () => {
    const query = tables.workspaces(deps.db).count()
    const [{ count }] = await query

    return parseInt(String(count))
  }
