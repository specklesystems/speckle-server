import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import {
  CountSeatsByTypeInWorkspace,
  CreateWorkspaceSeat
} from '@/modules/gatekeeper/domain/operations'
import { Knex } from 'knex'

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>('workspace_seats')
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
