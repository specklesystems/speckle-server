import {
  Workspace,
  WorkspaceAcl,
  WorkspaceAclUpdate,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import {
  DeleteWorkspace,
  DeleteWorkspaceRole,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceCollaboratorsTotalCount,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesForUser,
  GetWorkspaces,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import { StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  WorkspaceAcl as DbWorkspaceAcl,
  WorkspaceAclUpdates,
  Workspaces
} from '@/modules/workspaces/helpers/db'
import { knex, ServerAcl, ServerInvites, Users } from '@/modules/core/dbSchema'
import { UserWithRole } from '@/modules/core/repositories/users'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  filterByResource,
  InvitesRetrievalValidityFilter
} from '@/modules/serverinvites/repositories/serverInvites'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/graphqlHelper'
import { clamp } from 'lodash'
import cryptoRandomString from 'crypto-random-string'

const tables = {
  streams: (db: Knex) => db<StreamRecord>('streams'),
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl'),
  workspacesAclUpdates: (db: Knex) => db<WorkspaceAclUpdate>('workspace_acl_updates')
}

export const getWorkspacesFactory =
  ({ db }: { db: Knex }): GetWorkspaces =>
  async (params: {
    workspaceIds: string[]
    /**
     * Optionally - for each workspace, return the user's role in that workspace
     */
    userId?: string
  }) => {
    const { workspaceIds, userId } = params
    if (!workspaceIds?.length) return []

    const q = Workspaces.knex<WorkspaceWithOptionalRole[]>(db).whereIn(
      Workspaces.col.id,
      workspaceIds
    )

    if (userId) {
      q.select([
        ...Object.values(Workspaces.col),
        // Getting first role from grouped results
        knex.raw(`(array_agg("workspace_acl"."role"))[1] as role`)
      ])
      q.leftJoin(DbWorkspaceAcl.name, function () {
        this.on(DbWorkspaceAcl.col.workspaceId, Workspaces.col.id).andOnVal(
          DbWorkspaceAcl.col.userId,
          userId
        )
      })
      q.groupBy(Workspaces.col.id)
    }

    const results = await q
    return results
  }

export const getWorkspaceFactory =
  ({ db }: { db: Knex }): GetWorkspace =>
  async ({ workspaceId, userId }) => {
    const [workspace] = await getWorkspacesFactory({ db })({
      workspaceIds: [workspaceId],
      userId
    })

    return workspace || null
  }

export const upsertWorkspaceFactory =
  ({ db }: { db: Knex }): UpsertWorkspace =>
  async ({ workspace }) => {
    await tables
      .workspaces(db)
      .insert(workspace)
      .onConflict('id')
      .merge(['description', 'logo', 'defaultLogoIndex', 'name', 'updatedAt'])
  }

export const deleteWorkspaceFactory =
  ({ db }: { db: Knex }): DeleteWorkspace =>
  async ({ workspaceId }) => {
    await tables.workspaces(db).where({ id: workspaceId }).delete()
  }

export const getWorkspaceRolesFactory =
  ({ db }: { db: Knex }): GetWorkspaceRoles =>
  async ({ workspaceId }) => {
    return await tables.workspacesAcl(db).select('*').where({ workspaceId })
  }

export const getWorkspaceRoleForUserFactory =
  ({ db }: { db: Knex }): GetWorkspaceRoleForUser =>
  async ({ userId, workspaceId }) => {
    return (
      (await tables
        .workspacesAcl(db)
        .select('*')
        .where({ userId, workspaceId })
        .first()) ?? null
    )
  }

export const getWorkspaceRolesForUserFactory =
  ({ db }: { db: Knex }): GetWorkspaceRolesForUser =>
  async ({ userId }, options) => {
    const workspaceIdFilter = options?.workspaceIdFilter ?? []

    const query = tables.workspacesAcl(db).select('*').where({ userId })

    if (workspaceIdFilter.length > 0) {
      query.whereIn('workspaceId', workspaceIdFilter)
    }

    return await query
  }

export const deleteWorkspaceRoleFactory =
  ({ db }: { db: Knex }): DeleteWorkspaceRole =>
  async ({ userId, workspaceId }) => {
    const deletedRoles = await tables
      .workspacesAcl(db)
      .where({ workspaceId, userId })
      .delete('*')

    if (deletedRoles.length === 0) {
      return null
    }

    // Given `workspaceId` and `userId` define a primary key for `workspace_acl` table,
    // query returns either 0 or 1 row in all cases
    return deletedRoles[0]
  }

export const upsertWorkspaceRoleFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
  async ({ userId, workspaceId, role }) => {
    // Verify requested role is valid workspace role
    const validRoles = Object.values(Roles.Workspace)
    if (!validRoles.includes(role)) {
      throw new WorkspaceInvalidRoleError()
    }

    await tables
      .workspacesAcl(db)
      .insert({ userId, workspaceId, role })
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])

    await tables.workspacesAclUpdates(db).insert({
      id: cryptoRandomString({ length: 10 }),
      updatedAt: new Date(),
      userId,
      workspaceId,
      role
    })
  }

export const getWorkspaceCollaboratorsTotalCountFactory =
  ({ db }: { db: Knex }): GetWorkspaceCollaboratorsTotalCount =>
  async ({ workspaceId }) => {
    const [res] = await DbWorkspaceAcl.knex(db).where({ workspaceId }).count()
    const count = parseInt(res.count)
    return count || 0
  }

export const getWorkspaceCollaboratorsFactory =
  ({ db }: { db: Knex }): GetWorkspaceCollaborators =>
  async ({ workspaceId, filter = {}, cursor, limit = 25 }) => {
    const query = DbWorkspaceAcl.knex(db)
      .select<
        Array<
          UserWithRole & { workspaceRole: WorkspaceRoles; workspaceRoleUpdatedAt: Date }
        >
      >([
        ...Users.cols,
        knex.raw('(array_agg(??))[1] as ??', [ServerAcl.col.role, 'role']),
        knex.raw('(array_agg(??))[1] as ??', [
          DbWorkspaceAcl.col.role,
          'workspaceRole'
        ]),
        knex.raw('(array_agg(?? ORDER BY ?? ASC))[1] as ??', [
          WorkspaceAclUpdates.col.updatedAt,
          WorkspaceAclUpdates.col.updatedAt,
          'workspaceRoleUpdatedAt'
        ])
      ])
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      .innerJoin(Users.name, Users.col.id, DbWorkspaceAcl.col.userId)
      .innerJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .innerJoin(WorkspaceAclUpdates.name, WorkspaceAclUpdates.col.userId, Users.col.id)
      .orderBy('workspaceRoleUpdatedAt', 'desc')
      .groupBy(Users.col.id)

    const { search, role } = filter || {}

    if (search) {
      query
        .where(Users.col.name, 'ILIKE', `%${search}%`)
        .orWhere(Users.col.email, 'ILIKE', `%${search}%`)
    }

    if (role) {
      query.andWhere(DbWorkspaceAcl.col.role, role)
    }

    if (cursor) {
      query.andWhere(
        WorkspaceAclUpdates.col.updatedAt,
        '<',
        decodeIsoDateCursor(cursor)
      )
    }

    if (limit) {
      query.limit(clamp(limit, 0, 100))
    }

    const items = (await query).map((i) => ({
      ...removePrivateFields(i),
      workspaceRole: i.workspaceRole,
      role: i.role,
      updatedAt: i.workspaceRoleUpdatedAt
    }))

    return {
      items,
      cursor: items.length
        ? encodeIsoDateCursor(items[items.length - 1].updatedAt)
        : null
    }
  }

export const workspaceInviteValidityFilter: InvitesRetrievalValidityFilter = (q) => {
  return q
    .leftJoin(
      knex.raw(
        ":workspaces: ON :resourceCol: ->> 'resourceType' = :resourceType AND :resourceCol: ->> 'resourceId' = :workspaceIdCol:",
        {
          workspaces: Workspaces.name,
          resourceCol: ServerInvites.col.resource,
          resourceType: WorkspaceInviteResourceType,
          workspaceIdCol: Workspaces.col.id
        }
      )
    )
    .where((w1) => {
      w1.whereNot((w2) =>
        filterByResource(w2, { resourceType: WorkspaceInviteResourceType })
      ).orWhereNotNull(Workspaces.col.id)
    })
}
