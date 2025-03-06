import { buildTableHelper } from '@/modules/core/dbSchema'
import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import {
  CreateWorkspaceSeat,
  GetWorkspaceUserSeat,
  GetWorkspaceUserSeats
} from '@/modules/gatekeeper/domain/operations'
import { Knex } from 'knex'

const WorkspaceSeats = buildTableHelper('workspace_seats', [
  'workspaceId',
  'userId',
  'type',
  'createdAt',
  'updatedAt'
])

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>(WorkspaceSeats.name)
}

export const countSeatsByTypeInWorkspaceFactory =
  ({ db }: { db: Knex }) =>
  async ({
    workspaceId,
    type
  }: Pick<WorkspaceSeat, 'workspaceId' | 'type'>): Promise<number> => {
    const [count] = await tables
      .workspaceSeats(db)
      .where({ workspaceId, type })
      .count('id')
    return parseInt(count.toString())
  }

export const createWorkspaceSeatFactory =
  ({ db }: { db: Knex }): CreateWorkspaceSeat =>
  async ({ userId, workspaceId, type }) => {
    await tables
      .workspaceSeats(db)
      .insert({
        workspaceId,
        userId,
        type
      })
      .onConflict(['workspaceId', 'userId'])
      .merge()
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
