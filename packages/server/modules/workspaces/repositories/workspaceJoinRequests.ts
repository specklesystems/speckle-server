import {
  CreateWorkspaceJoinRequest,
  GetWorkspaceJoinRequest,
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
import { SetRequired } from 'type-fest'

const tables = {
  workspaceJoinRequests: (db: Knex) =>
    db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
}

export const createWorkspaceJoinRequestFactory =
  ({ db }: { db: Knex }): CreateWorkspaceJoinRequest =>
  async ({ workspaceJoinRequest }) => {
    const res = await tables
      .workspaceJoinRequests(db)
      .insert(workspaceJoinRequest, '*')
      .onConflict()
      .ignore()
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

export const getWorkspaceJoinRequestFactory =
  ({ db }: { db: Knex }): GetWorkspaceJoinRequest =>
  async ({ workspaceId, userId, status }) => {
    const query = tables
      .workspaceJoinRequests(db)
      .where(WorkspaceJoinRequests.col.workspaceId, workspaceId)
      .where(WorkspaceJoinRequests.col.userId, userId)
    if (status) {
      query.andWhere(WorkspaceJoinRequests.col.status, status)
    }

    return await query.first()
  }

type WorkspaceJoinRequestFilter = {
  workspaceId?: string
  status?: WorkspaceJoinRequestStatus | null
  userId: string
}

const adminWorkspaceJoinRequestsBaseQueryFactory =
  (db: Knex) => (filter: SetRequired<WorkspaceJoinRequestFilter, 'workspaceId'>) => {
    const query = tables
      .workspaceJoinRequests(db)
      .innerJoin(
        WorkspaceAcl.name,
        WorkspaceAcl.col.workspaceId,
        WorkspaceJoinRequests.col.workspaceId
      )
      .where(WorkspaceAcl.col.role, Roles.Workspace.Admin)
      .where(WorkspaceAcl.col.userId, filter.userId)
      .where(WorkspaceJoinRequests.col.workspaceId, filter.workspaceId)
      .whereNot(WorkspaceJoinRequests.col.status, 'dismissed')
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
    filter: SetRequired<WorkspaceJoinRequestFilter, 'workspaceId'>
    cursor?: string
    limit: number
  }) => {
    const query = adminWorkspaceJoinRequestsBaseQueryFactory(db)(filter)

    if (cursor) {
      query.andWhere(WorkspaceJoinRequests.col.createdAt, '<', cursor)
    }
    return await query
      .select<WorkspaceJoinRequest[]>(WorkspaceJoinRequests.cols)
      .orderBy(WorkspaceJoinRequests.col.createdAt, 'desc')
      .limit(limit)
  }

export const countAdminWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  async ({
    filter
  }: {
    filter: SetRequired<WorkspaceJoinRequestFilter, 'workspaceId'>
  }) => {
    const query = adminWorkspaceJoinRequestsBaseQueryFactory(db)(filter)

    const [res] = await query.count()
    return parseInt(res.count.toString())
  }

const workspaceJoinRequestsBaseQueryFactory =
  (db: Knex) => (filter: WorkspaceJoinRequestFilter) => {
    const query = tables
      .workspaceJoinRequests(db)
      .where(WorkspaceJoinRequests.col.userId, filter.userId)
      .whereNot(WorkspaceJoinRequests.col.status, 'dismissed')
    if (filter.status) query.andWhere(WorkspaceJoinRequests.col.status, filter.status)
    if (filter.userId) query.andWhere(WorkspaceJoinRequests.col.userId, filter.userId)
    if (filter.workspaceId)
      query.andWhere(WorkspaceJoinRequests.col.workspaceId, filter.workspaceId)
    return query
  }

export const getWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  ({
    filter,
    cursor,
    limit
  }: {
    filter: WorkspaceJoinRequestFilter
    cursor?: string
    limit: number
  }) => {
    const query = workspaceJoinRequestsBaseQueryFactory(db)(filter)

    if (cursor) {
      query.andWhere(WorkspaceJoinRequests.col.createdAt, '<', cursor)
    }
    return query
      .select<WorkspaceJoinRequest[]>(WorkspaceJoinRequests.cols)
      .orderBy(WorkspaceJoinRequests.col.createdAt, 'desc')
      .limit(limit)
  }

export const countWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  async ({ filter }: { filter: WorkspaceJoinRequestFilter }) => {
    const query = workspaceJoinRequestsBaseQueryFactory(db)(filter)

    const [res] = await query.count()
    return parseInt(res.count.toString())
  }
