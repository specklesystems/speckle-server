import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import type {
  GetWorkspaceRoleAndSeat,
  GetWorkspaceRolesAndSeats
} from '@/modules/workspacesCore/domain/operations'
import type {
  WorkspaceSeat,
  WorkspaceAcl as WorkspaceAclRecord
} from '@/modules/workspacesCore/domain/types'
import { WorkspaceAcl, WorkspaceSeats } from '@/modules/workspacesCore/helpers/db'
import type { Knex } from 'knex'

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>(WorkspaceSeats.name),
  workspaceAcl: (db: Knex) => db<WorkspaceAclRecord>(WorkspaceAcl.name)
}

export const getWorkspaceRolesAndSeatsFactory =
  (deps: { db: Knex }): GetWorkspaceRolesAndSeats =>
  async ({ workspaceId, userIds }) => {
    const q = tables
      .workspaceAcl(deps.db)
      .select<Array<{ seats: WorkspaceSeat[]; roles: WorkspaceAclRecord[] }>>([
        // There's only ever gonna be 1 role and seat per user, but this way we can avoid having to group
        // by many columns and we can get everything in 1 query
        WorkspaceAcl.groupArray('roles'),
        WorkspaceSeats.groupArray('seats')
      ])
      .leftJoin(WorkspaceSeats.name, (j1) => {
        j1.on(WorkspaceSeats.col.userId, WorkspaceAcl.col.userId).andOnVal(
          WorkspaceSeats.col.workspaceId,
          workspaceId
        )
      })
      .where(WorkspaceAcl.col.workspaceId, workspaceId)
      .groupBy(WorkspaceAcl.col.userId)

    if (userIds?.length) {
      q.whereIn(WorkspaceAcl.col.userId, userIds)
    }

    const res = await q
    return res.reduce((acc, row) => {
      const role = formatJsonArrayRecords(row.roles)[0]
      if (!role) return acc

      acc[role.userId] = {
        role,
        seat: formatJsonArrayRecords(row.seats || [])[0],
        userId: role.userId
      }
      return acc
    }, {} as Awaited<ReturnType<GetWorkspaceRolesAndSeats>>)
  }

export const getWorkspaceRoleAndSeatFactory =
  (deps: { db: Knex }): GetWorkspaceRoleAndSeat =>
  async ({ workspaceId, userId }) => {
    const getWorkspaceRolesAndSeats = getWorkspaceRolesAndSeatsFactory(deps)
    const rolesAndSeats = await getWorkspaceRolesAndSeats({
      workspaceId,
      userIds: [userId]
    })
    return rolesAndSeats[userId]
  }
