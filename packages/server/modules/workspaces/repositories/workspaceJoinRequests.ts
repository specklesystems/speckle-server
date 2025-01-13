import {
  CreateWorkspaceJoinRequest,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceJoinRequest,
  WorkspaceJoinRequestStatus
} from '@/modules/workspacesCore/domain/types'
import {
  WorkspaceAcl,
  WorkspaceJoinRequests
} from '@/modules/workspacesCore/helpers/db'
import { Roles } from '@speckle/shared'
import { Knex } from 'knex'

const tables = {
  workspaceJoinRequests: (db: Knex) =>
    db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
}

export const createWorkspaceJoinRequestFactory =
  ({ db }: { db: Knex }): CreateWorkspaceJoinRequest =>
  async ({ workspaceJoinRequest }) => {
    const res = await tables.workspaceJoinRequests(db).insert(workspaceJoinRequest, '*')
    return res[0]
  }

export const updateWorkspaceJoinRequestStatusFactory =
  ({ db }: { db: Knex }): UpdateWorkspaceJoinRequestStatus =>
  async ({ workspaceId, userId, status }) => {
    return await tables
      .workspaceJoinRequests(db)
      .insert({ workspaceId, userId, status })
      .onConflict(['workspaceId', 'userId'])
      .merge(['status'])
  }

type WorkspaceJoinRequestFilter = {
  status?: WorkspaceJoinRequestStatus | null
  userId: string
}

const adminWorkspaceJoinRequestsBaseQueryFactory =
  (db: Knex) => (filter: WorkspaceJoinRequestFilter) => {
    const query = tables
      .workspaceJoinRequests(db)
      .innerJoin(
        WorkspaceAcl.name,
        WorkspaceAcl.col.workspaceId,
        WorkspaceJoinRequests.col.workspaceId
      )
      .where(WorkspaceAcl.col.role, Roles.Workspace.Admin)
      .where(WorkspaceAcl.col.userId, filter.userId)
    if (filter.status) query.andWhere(WorkspaceJoinRequests.col.status, filter.status)
    return query
  }

export const getAdminWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  async ({
    filter,
    cursor,
    limit
  }: {
    filter: WorkspaceJoinRequestFilter
    cursor?: string
    limit: number
  }) => {
    const query = adminWorkspaceJoinRequestsBaseQueryFactory(db)(filter)

    if (cursor) {
      query.andWhere(WorkspaceJoinRequests.col.createdAt, '<', cursor)
    }
    return await query
      .select<WorkspaceJoinRequest>(WorkspaceJoinRequests.cols)
      .orderBy(WorkspaceJoinRequests.col.createdAt, 'desc')
      .limit(limit)
  }

export const countAdminWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  async ({ filter }: { filter: WorkspaceJoinRequestFilter }) => {
    const query = adminWorkspaceJoinRequestsBaseQueryFactory(db)(filter)

    const [res] = await query.count()
    return parseInt(res.count.toString())
  }
