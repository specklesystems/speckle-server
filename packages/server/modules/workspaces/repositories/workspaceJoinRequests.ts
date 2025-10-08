import { UserEmails } from '@/modules/core/dbSchema'
import { compositeCursorTools } from '@/modules/shared/helpers/dbHelper'
import type {
  CreateWorkspaceJoinRequest,
  GetWorkspaceJoinRequest,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import type {
  WorkspaceJoinRequest,
  WorkspaceJoinRequestStatus
} from '@/modules/workspacesCore/domain/types'
import {
  WorkspaceAcl,
  WorkspaceJoinRequests
} from '@/modules/workspacesCore/helpers/db'
import { Roles } from '@speckle/shared'
import type { Knex } from 'knex'
import type { SetRequired } from 'type-fest'

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
      .join(UserEmails.name, UserEmails.col.userId, WorkspaceJoinRequests.col.userId)
      // returning the primary here as a shortcut
      // should be doing an intersection with the workspace domains, the users emails
      // and be distincted to a single user
      // but for now, multi email usage is low enough to not warrant that here
      .where(UserEmails.col.primary, '=', true)
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
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: WorkspaceJoinRequests,
      cols: ['createdAt', 'userId']
    })
    const query = adminWorkspaceJoinRequestsBaseQueryFactory(db)(filter)
    applyCursorSortAndFilter({
      query,
      cursor
    })

    query
      .select<WorkspaceJoinRequest[]>([
        ...WorkspaceJoinRequests.cols,
        UserEmails.col.email
      ])
      .limit(limit)

    const items = await query
    const newCursor = resolveNewCursor(items)

    return {
      items,
      cursor: newCursor
    }
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
  async ({
    filter,
    cursor,
    limit
  }: {
    filter: WorkspaceJoinRequestFilter
    cursor?: string
    limit: number
  }) => {
    const query = workspaceJoinRequestsBaseQueryFactory(db)(filter)
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: WorkspaceJoinRequests,
      cols: ['createdAt', 'userId']
    })
    applyCursorSortAndFilter({
      query,
      cursor
    })

    query.select<WorkspaceJoinRequest[]>(WorkspaceJoinRequests.cols).limit(limit)

    const items = await query
    const newCursor = resolveNewCursor(items)

    return {
      items,
      cursor: newCursor
    }
  }

export const countWorkspaceJoinRequestsFactory =
  ({ db }: { db: Knex }) =>
  async ({ filter }: { filter: WorkspaceJoinRequestFilter }) => {
    const query = workspaceJoinRequestsBaseQueryFactory(db)(filter)

    const [res] = await query.count()
    return parseInt(res.count.toString())
  }
