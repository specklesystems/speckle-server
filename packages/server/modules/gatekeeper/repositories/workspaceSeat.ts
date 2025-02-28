import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { Knex } from 'knex'

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>('workspace_seats')
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
