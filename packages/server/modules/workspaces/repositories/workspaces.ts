import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import {
  DeleteWorkspace,
  DeleteWorkspaceDomain,
  DeleteWorkspaceRole,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceDomains,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesForUser,
  GetWorkspaces,
  StoreWorkspaceDomain,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import { StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  WorkspaceAcl as DbWorkspaceAcl,
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

const tables = {
  streams: (db: Knex) => db<StreamRecord>('streams'),
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspaceDomains: (db: Knex) => db<WorkspaceDomain>('workspace_domains'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl')
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
      .merge(['description', 'logo', 'name', 'updatedAt', 'domains'])
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
  }

export const getWorkspaceCollaboratorsFactory =
  ({ db }: { db: Knex }): GetWorkspaceCollaborators =>
  async (params: { workspaceId: string; role?: WorkspaceRoles }) => {
    const { workspaceId, role } = params

    const query = DbWorkspaceAcl.knex(db)
      .select<Array<UserWithRole & { workspaceRole: WorkspaceRoles }>>([
        ...Users.cols,
        knex.raw(`${DbWorkspaceAcl.col.role} as "workspaceRole"`),
        knex.raw(`(array_agg(${ServerAcl.col.role}))[1] as "role"`)
      ])
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      .innerJoin(Users.name, Users.col.id, DbWorkspaceAcl.col.userId)
      .innerJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .groupBy(Users.col.id, DbWorkspaceAcl.col.role)

    if (role) {
      query.andWhere(DbWorkspaceAcl.col.role, role)
    }

    const items = (await query).map((i) => ({
      ...removePrivateFields(i),
      workspaceRole: i.workspaceRole,
      role: i.role
    }))

    return items
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

export const storeWorkspaceDomainFactory =
  ({ db }: { db: Knex }): StoreWorkspaceDomain =>
  async ({ workspaceDomain }): Promise<void> => {
    await tables.workspaceDomains(db).insert(workspaceDomain)
  }

export const getWorkspaceDomainsFactory =
  ({ db }: { db: Knex }): GetWorkspaceDomains =>
  ({ workspaceIds }) => {
    return tables.workspaceDomains(db).whereIn('workspaceId', workspaceIds)
  }

export const deleteWorkspaceDomainFactory =
  ({ db }: { db: Knex }): DeleteWorkspaceDomain =>
  async ({ id }) => {
    await tables.workspaceDomains(db).where({ id }).delete()
  }
