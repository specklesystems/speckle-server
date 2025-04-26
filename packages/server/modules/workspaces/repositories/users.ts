import { StreamAcl, Streams, UserEmails, Users } from '@/modules/core/dbSchema'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { StreamAclRecord, UserRecord } from '@/modules/core/helpers/types'
import { SetUserActiveWorkspace } from '@/modules/workspaces/domain/operations'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const tables = {
  users: (db: Knex) => db<UserRecord>(Users.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
}

export const setUserActiveWorkspaceFactory =
  (deps: { db: Knex }): SetUserActiveWorkspace =>
  async ({ userId, workspaceSlug, isProjectsActive = false }) => {
    const meta = metaHelpers(Users, deps.db)
    await Promise.all([
      meta.set(userId, 'activeWorkspace', workspaceSlug),
      meta.set(userId, 'isProjectsActive', isProjectsActive)
    ])
  }

const buildInvitableCollaboratorsByProjectIdQueryFactory =
  ({ db }: { db: Knex }) =>
  ({
    workspaceId,
    projectId,
    search
  }: {
    workspaceId: string
    projectId: string
    search?: string
  }) => {
    const query = tables
      .users(db)
      .join(WorkspaceAcl.name, WorkspaceAcl.col.userId, Users.col.id)
      .join(Streams.name, Streams.col.workspaceId, WorkspaceAcl.col.workspaceId)
      .where(WorkspaceAcl.col.workspaceId, workspaceId)
      .whereNotIn(
        Users.col.id,
        tables
          .streamAcl(db)
          .select(StreamAcl.col.userId)
          .where(StreamAcl.col.resourceId, projectId)
      )
    if (search) {
      query
        .join(UserEmails.name, UserEmails.col.userId, Users.col.id)
        .andWhere((w) =>
          w
            .whereLike(Users.col.name, `%${search}%`)
            .orWhereLike(UserEmails.col.email, `%${search}%`)
        )
    }
    return query.groupBy(Users.col.id)
  }

export const getInvitableCollaboratorsByProjectIdFactory =
  ({ db }: { db: Knex }) =>
  async ({
    filter,
    cursor,
    limit
  }: {
    filter: {
      workspaceId: string
      projectId: string
      search?: string
    }
    cursor?: string
    limit: number
  }): Promise<WorkspaceTeamMember[]> => {
    const { workspaceId, projectId, search } = filter
    const query = buildInvitableCollaboratorsByProjectIdQueryFactory({ db })({
      workspaceId,
      projectId,
      search
    })
    if (cursor) {
      query.andWhere(Users.col.createdAt, '<', cursor)
    }
    return await query
      .orderBy(Users.col.createdAt, 'desc')
      .limit(limit)
      .select(Users.cols.filter((col) => col !== Users.col.passwordDigest))
  }

export const countInvitableCollaboratorsByProjectIdFactory =
  ({ db }: { db: Knex }) =>
  async ({
    filter
  }: {
    filter: {
      workspaceId: string
      projectId: string
      search?: string
    }
  }) => {
    const { workspaceId, projectId, search } = filter
    const query = buildInvitableCollaboratorsByProjectIdQueryFactory({ db })({
      workspaceId,
      projectId,
      search
    })
    const [res] = await query.count()
    return parseInt(res?.count?.toString() ?? '0')
  }
