import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  GetWorkspaceRolesAndSeats,
  WorkspaceSeat
} from '@/modules/gatekeeper/domain/billing'
import {
  CountSeatsByTypeInWorkspace,
  CreateWorkspaceSeat,
  DeleteWorkspaceSeat,
  GetWorkspaceUserSeat,
  GetWorkspaceUserSeats
} from '@/modules/gatekeeper/domain/operations'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import { WorkspaceAcl as WorkspaceAclRecord } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const WorkspaceSeats = buildTableHelper('workspace_seats', [
  'workspaceId',
  'userId',
  'type',
  'createdAt',
  'updatedAt'
])

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>(WorkspaceSeats.name),
  workspaceAcl: (db: Knex) => db<WorkspaceAclRecord>(WorkspaceAcl.name)
}

export const countSeatsByTypeInWorkspaceFactory =
  ({ db }: { db: Knex }): CountSeatsByTypeInWorkspace =>
  async ({ workspaceId, type }) => {
    const [count] = await tables
      .workspaceSeats(db)
      .where({ workspaceId, type })
      .count('userId')
    return parseInt(count.count.toString())
  }

export const createWorkspaceSeatFactory =
  ({ db }: { db: Knex }): CreateWorkspaceSeat =>
  async ({ userId, workspaceId, type }, { skipIfExists } = {}) => {
    const qBase = tables
      .workspaceSeats(db)
      .insert(
        {
          workspaceId,
          userId,
          type
        },
        '*'
      )
      .onConflict(['workspaceId', 'userId'])
    const q = skipIfExists ? qBase.ignore() : qBase.merge()

    const [seat] = await q
    return seat
  }

export const deleteWorkspaceSeatFactory =
  (deps: { db: Knex }): DeleteWorkspaceSeat =>
  async ({ userId, workspaceId }) => {
    await tables.workspaceSeats(deps.db).where({ userId, workspaceId }).delete()
  }

export const getWorkspaceUserSeatsFactory =
  ({ db }: { db: Knex }): GetWorkspaceUserSeats =>
  async ({ workspaceId, userIds }) => {
    const seats = await tables
      .workspaceSeats(db)
      .where(WorkspaceSeats.col.workspaceId, workspaceId)
      .whereIn(WorkspaceSeats.col.userId, userIds)
    return seats.reduce((acc, seat) => {
      acc[seat.userId] = seat
      return acc
    }, {} as { [userId: string]: WorkspaceSeat })
  }

export const getWorkspaceUserSeatFactory =
  ({ db }: { db: Knex }): GetWorkspaceUserSeat =>
  async ({ workspaceId, userId }) => {
    const seats = await getWorkspaceUserSeatsFactory({ db })({
      workspaceId,
      userIds: [userId]
    })
    return seats[userId]
  }

export const getWorkspaceRolesAndSeatsFactory =
  (deps: { db: Knex }): GetWorkspaceRolesAndSeats =>
  async ({ workspaceId }) => {
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

    const res = await q
    return res.reduce((acc, row) => {
      const role = formatJsonArrayRecords(row.roles)[0]
      if (!role) return acc

      acc[role.userId] = {
        role,
        seat: formatJsonArrayRecords(row.seats || [])[0] || null,
        userId: role.userId
      }
      return acc
    }, {} as Awaited<ReturnType<GetWorkspaceRolesAndSeats>>)
  }
