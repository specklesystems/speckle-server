import {
  ServerAcl,
  StreamAcl,
  Streams,
  UserEmails,
  Users
} from '@/modules/core/dbSchema'
import type { UserEmail } from '@/modules/core/domain/userEmails/types'
import { metaHelpers } from '@/modules/core/helpers/meta'
import type { StreamAclRecord, UserRecord } from '@/modules/core/helpers/types'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'
import { compositeCursorTools } from '@/modules/shared/helpers/dbHelper'
import type { SetUserActiveWorkspace } from '@/modules/workspaces/domain/operations'
import type { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import type { WorkspaceAcl as WorkspaceAclRecord } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import type { ServerRoles } from '@speckle/shared'
import type { Knex } from 'knex'

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
      .select([
        ...Users.cols,
        WorkspaceAcl.groupArray('workspaceAcl'),
        ServerAcl.groupArray('serverAcl'),
        UserEmails.groupArray('emails')
      ])
      .join(WorkspaceAcl.name, WorkspaceAcl.col.userId, Users.col.id)
      .join(Streams.name, Streams.col.workspaceId, WorkspaceAcl.col.workspaceId)
      .join(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .join(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .where(WorkspaceAcl.col.workspaceId, workspaceId)
      .whereNotIn(
        Users.col.id,
        tables
          .streamAcl(db)
          .select(StreamAcl.col.userId)
          .where(StreamAcl.col.resourceId, projectId)
      )
    if (search) {
      query.andWhere((w) =>
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
  }): Promise<{ items: WorkspaceTeamMember[]; cursor: string | null }> => {
    const { workspaceId, projectId, search } = filter
    const query = buildInvitableCollaboratorsByProjectIdQueryFactory({ db })({
      workspaceId,
      projectId,
      search
    })
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: Users,
      cols: ['createdAt', 'id']
    })

    applyCursorSortAndFilter({
      query,
      cursor
    })

    query.limit(limit)

    const res = await query
    const nextCursor = resolveNewCursor(res)

    const formattedRes = res.map((row) => {
      const workspaceAcl = formatJsonArrayRecords(
        row.workspaceAcl
      )[0] as WorkspaceAclRecord
      const serverAcl = formatJsonArrayRecords(row.serverAcl)[0] as StreamAclRecord
      const emails = formatJsonArrayRecords(row.emails) as UserEmail[]
      const email = emails.find((e) => e.primary)?.email

      return {
        ...removePrivateFields(row),
        workspaceRole: workspaceAcl.role,
        workspaceRoleCreatedAt: workspaceAcl.createdAt,
        workspaceId: workspaceAcl.workspaceId,
        role: serverAcl.role as ServerRoles,
        email: email!
      }
    })

    return { items: formattedRes, cursor: nextCursor }
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
    const query = db
      .from(
        buildInvitableCollaboratorsByProjectIdQueryFactory({ db })({
          workspaceId,
          projectId,
          search
        }).as('sq1')
      )
      .count()

    const [res] = await query
    return parseInt(res?.count?.toString() ?? '0')
  }
