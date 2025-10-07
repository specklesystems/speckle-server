import type {
  CountWorkspaceUsers,
  GetTotalWorkspaceCountFactory,
  GetUserWorkspaceCountFactory,
  GetUserWorkspaceSeatsFactory
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

export const countWorkspaceUsersFactory =
  ({ db }: { db: Knex }): CountWorkspaceUsers =>
  async (args) => {
    const query = tables
      .workspaceAcl(db)
      .innerJoin(WorkspaceSeats.name, function () {
        this.on(WorkspaceAclDb.col.userId, WorkspaceSeats.col.userId).on(
          WorkspaceAclDb.col.workspaceId,
          WorkspaceSeats.col.workspaceId
        )
      })
      .where(WorkspaceSeats.col.workspaceId, args.workspaceId)

    if (args.filter?.role) {
      query.where(WorkspaceAclDb.col.role, args.filter.role)
    }

    if (args.filter?.seatType) {
      query.where(WorkspaceSeats.col.type, args.filter.seatType)
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
