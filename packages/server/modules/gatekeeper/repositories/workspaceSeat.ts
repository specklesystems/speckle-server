import { StreamAcl, Streams } from '@/modules/core/dbSchema'
import type { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import type { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import type {
  CountSeatsByTypeInWorkspace,
  CreateWorkspaceSeat,
  DeleteWorkspaceSeat,
  GetProjectsUsersSeats,
  GetWorkspacesUsersSeats,
  GetWorkspaceUserSeat,
  GetWorkspaceUserSeats
} from '@/modules/gatekeeper/domain/operations'
import type { WorkspaceAcl as WorkspaceAclRecord } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAcl, WorkspaceSeats } from '@/modules/workspacesCore/helpers/db'
import type { Knex } from 'knex'
export {
  getWorkspaceRoleAndSeatFactory,
  getWorkspaceRolesAndSeatsFactory
} from '@/modules/workspacesCore/repositories/rolesSeats'

const tables = {
  workspaceSeats: (db: Knex) => db<WorkspaceSeat>(WorkspaceSeats.name),
  workspaceAcl: (db: Knex) => db<WorkspaceAclRecord>(WorkspaceAcl.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name),
  streams: (db: Knex) => db<StreamRecord>(Streams.name)
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

export const getWorkspacesUsersSeatsFactory =
  (deps: { db: Knex }): GetWorkspacesUsersSeats =>
  async (params) => {
    const { requests } = params
    const q = tables.workspaceSeats(deps.db).whereIn(
      [WorkspaceSeats.col.workspaceId, WorkspaceSeats.col.userId],
      requests.map(({ userId, workspaceId }) => [workspaceId, userId])
    )
    const results = await q

    return results.reduce((acc, seat) => {
      const { userId, workspaceId } = seat
      if (!acc[workspaceId]) {
        acc[workspaceId] = {}
      }

      if (!acc[workspaceId][userId]) {
        acc[workspaceId][userId] = seat
      }
      return acc
    }, {} as Awaited<ReturnType<GetWorkspacesUsersSeats>>)
  }

export const getProjectsUsersSeatsFactory =
  (deps: { db: Knex }): GetProjectsUsersSeats =>
  async (params: {
    requests: Array<{
      userId: string
      projectId: string
    }>
  }) => {
    const { requests } = params
    const idPairs = requests.map(({ userId, projectId }) => [userId, projectId])

    const q = tables
      .streamAcl(deps.db)
      .whereIn([StreamAcl.col.userId, StreamAcl.col.resourceId], idPairs)
      .innerJoin(Streams.name, Streams.col.id, StreamAcl.col.resourceId)
      .leftJoin(WorkspaceSeats.name, (j1) => {
        j1.on(WorkspaceSeats.col.userId, StreamAcl.col.userId).andOn(
          WorkspaceSeats.col.workspaceId,
          Streams.col.workspaceId
        )
      })
      .select<Array<StreamAclRecord & WorkspaceSeat>>([
        ...StreamAcl.cols,
        ...WorkspaceSeats.cols
      ])

    const results = await q

    return results.reduce((acc, row) => {
      const { userId, resourceId: projectId } = row
      if (!acc[projectId]) {
        acc[projectId] = {}
      }

      if (!acc[projectId][userId]) {
        acc[projectId][userId] = row
      }
      return acc
    }, {} as Awaited<ReturnType<GetProjectsUsersSeats>>)
  }
