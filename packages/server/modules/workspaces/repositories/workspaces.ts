import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import {
  CountDomainsByWorkspaceId,
  CountWorkspaceRoleWithOptionalProjectRole,
  DeleteWorkspace,
  DeleteWorkspaceDomain,
  DeleteWorkspaceRole,
  GetUserDiscoverableWorkspaces,
  GetUserIdsWithRoleInWorkspace,
  GetWorkspace,
  GetWorkspaceBySlug,
  GetWorkspaceBySlugOrId,
  GetWorkspaceCollaborators,
  GetWorkspaceCollaboratorsTotalCount,
  GetWorkspaceDomains,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesForUser,
  GetWorkspaceWithDomains,
  GetWorkspaces,
  StoreWorkspaceDomain,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Knex } from 'knex'
import { Roles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  WorkspaceAcl as DbWorkspaceAcl,
  WorkspaceDomains,
  Workspaces
} from '@/modules/workspaces/helpers/db'
import {
  knex,
  ServerAcl,
  ServerInvites,
  StreamAcl,
  Streams,
  Users
} from '@/modules/core/dbSchema'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  filterByResource,
  InvitesRetrievalValidityFilter
} from '@/modules/serverinvites/repositories/serverInvites'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { clamp } from 'lodash'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'

const tables = {
  streams: (db: Knex) => db<StreamRecord>('streams'),
  streamAcl: (db: Knex) => db<StreamAclRecord>('stream_acl'),
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspaceDomains: (db: Knex) => db<WorkspaceDomain>('workspace_domains'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl')
}

export const getUserDiscoverableWorkspacesFactory =
  ({ db }: { db: Knex }): GetUserDiscoverableWorkspaces =>
  async ({ domains, userId }) => {
    if (domains.length === 0) {
      return []
    }
    return (await tables
      .workspaces(db)
      .select(
        'workspaces.id as id',
        'name',
        'slug',
        'description',
        'logo',
        'defaultLogoIndex'
      )
      .distinctOn('workspaces.id')
      .join('workspace_domains', 'workspace_domains.workspaceId', 'workspaces.id')
      .leftJoin(
        tables.workspacesAcl(db).select('*').where({ userId }).as('acl'),
        'acl.workspaceId',
        'workspaces.id'
      )
      .whereIn('domain', domains)
      .where('discoverabilityEnabled', true)
      .where('verified', true)
      .where('role', null)) as Pick<
      Workspace,
      'id' | 'name' | 'slug' | 'description' | 'logo' | 'defaultLogoIndex'
    >[]
  }

const workspaceWithRoleBaseQuery = ({
  db,
  userId
}: {
  db: Knex
  userId?: string
}): Knex.QueryBuilder<WorkspaceWithOptionalRole, WorkspaceWithOptionalRole[]> => {
  let q = db<WorkspaceWithOptionalRole, WorkspaceWithOptionalRole[]>('workspaces')
  if (userId) {
    q = q
      .select([
        ...Object.values(Workspaces.col),
        // Getting first role from grouped results
        knex.raw(`(array_agg("workspace_acl"."role"))[1] as role`)
      ])
      .leftJoin(DbWorkspaceAcl.name, function () {
        this.on(DbWorkspaceAcl.col.workspaceId, Workspaces.col.id).andOnVal(
          DbWorkspaceAcl.col.userId,
          userId
        )
      })
      .groupBy(Workspaces.col.id)
  }
  return q
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

    const q = workspaceWithRoleBaseQuery({ db, userId })
    const results = await q.whereIn(Workspaces.col.id, workspaceIds)
    return results
  }

export const getWorkspaceFactory =
  ({ db }: { db: Knex }): GetWorkspace =>
  async ({ workspaceId, userId }) => {
    const workspace = await workspaceWithRoleBaseQuery({ db, userId })
      .where(Workspaces.col.id, workspaceId)
      .first()

    return workspace || null
  }

export const getWorkspaceBySlugOrIdFactory =
  (deps: { db: Knex }): GetWorkspaceBySlugOrId =>
  async ({ workspaceSlugOrId }) => {
    const { db } = deps
    const workspace = await workspaceWithRoleBaseQuery({ db })
      .where(Workspaces.col.slug, workspaceSlugOrId)
      .orWhere(Workspaces.col.id, workspaceSlugOrId)
      .first()

    return workspace || null
  }

export const getWorkspaceBySlugFactory =
  ({ db }: { db: Knex }): GetWorkspaceBySlug =>
  async ({ workspaceSlug, userId }) => {
    const workspace = await workspaceWithRoleBaseQuery({ db, userId })
      .where(Workspaces.col.slug, workspaceSlug)
      .first()

    return workspace || null
  }

export const upsertWorkspaceFactory =
  ({ db }: { db: Knex }): UpsertWorkspace =>
  async ({ workspace }) => {
    await tables
      .workspaces(db)
      .insert(workspace)
      .onConflict('id')
      .merge([
        'description',
        'logo',
        'slug',
        'defaultLogoIndex',
        'defaultProjectRole',
        'name',
        'updatedAt',
        'domainBasedMembershipProtectionEnabled',
        'discoverabilityEnabled'
      ])
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
  async ({ userId, workspaceId, role, createdAt }) => {
    // Verify requested role is valid workspace role
    const validRoles = Object.values(Roles.Workspace)
    if (!validRoles.includes(role)) {
      throw new WorkspaceInvalidRoleError()
    }

    await tables
      .workspacesAcl(db)
      .insert({ userId, workspaceId, role, createdAt })
      .onConflict(['userId', 'workspaceId'])
      .merge(['role'])
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
    const query = db
      .from(Users.name)
      .select<Array<WorkspaceTeamMember & { workspaceRoleCreatedAt: Date }>>(
        ...Users.cols,
        ServerAcl.col.role,
        DbWorkspaceAcl.col.workspaceId, // this field is necessary for projectRoles field resolver
        DbWorkspaceAcl.colAs('role', 'workspaceRole'),
        DbWorkspaceAcl.colAs('createdAt', 'workspaceRoleCreatedAt')
      )
      .join(DbWorkspaceAcl.name, DbWorkspaceAcl.col.userId, Users.col.id)
      .join(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      .orderBy('workspaceRoleCreatedAt', 'desc')

    const { search, roles } = filter || {}

    if (search) {
      query.andWhere((builder) => {
        builder
          .where(Users.col.name, 'ILIKE', `%${search}%`)
          .orWhere(Users.col.email, 'ILIKE', `%${search}%`)
      })
    }

    if (roles) {
      query.andWhere((builder) => {
        builder.whereIn(DbWorkspaceAcl.col.role, roles)
      })
    }

    if (cursor) {
      query.andWhere(DbWorkspaceAcl.col.createdAt, '<', cursor)
    }

    if (limit) {
      query.limit(clamp(limit, 0, 100))
    }

    const items = (await query).map((i) => ({
      ...removePrivateFields(i),
      workspaceRole: i.workspaceRole,
      workspaceId: i.workspaceId,
      role: i.role,
      createdAt: i.workspaceRoleCreatedAt
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

export const countDomainsByWorkspaceIdFactory =
  ({ db }: { db: Knex }): CountDomainsByWorkspaceId =>
  async ({ workspaceId }) => {
    const [res] = await tables.workspaceDomains(db).where({ workspaceId }).count()
    return parseInt(res.count.toString())
  }

export const deleteWorkspaceDomainFactory =
  ({ db }: { db: Knex }): DeleteWorkspaceDomain =>
  async ({ id }) => {
    await tables.workspaceDomains(db).where({ id }).delete()
  }

export const getWorkspaceWithDomainsFactory =
  ({ db }: { db: Knex }): GetWorkspaceWithDomains =>
  async ({ id }) => {
    const workspace = await tables
      .workspaces(db)
      .select([...Workspaces.cols, WorkspaceDomains.groupArray('domains')])
      .where({ [Workspaces.col.id]: id })
      .leftJoin(
        WorkspaceDomains.name,
        WorkspaceDomains.col.workspaceId,
        Workspaces.col.id
      )
      .groupBy(Workspaces.col.id)
      .first()
    if (!workspace) return null
    return {
      ...workspace,
      domains: workspace.domains.filter(
        (domain: WorkspaceDomain | null) => domain !== null
      )
    } as Workspace & { domains: WorkspaceDomain[] }
  }

export const getUserIdsWithRoleInWorkspaceFactory =
  ({ db }: { db: Knex }): GetUserIdsWithRoleInWorkspace =>
  async ({ workspaceId, workspaceRole }, options) => {
    const query = tables
      .workspacesAcl(db)
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      .where(DbWorkspaceAcl.col.role, workspaceRole)
      .orderBy(DbWorkspaceAcl.col.createdAt)

    if (options?.limit) {
      query.limit(options.limit)
    }

    return (
      (await query.select([DbWorkspaceAcl.col.userId])) as Pick<
        WorkspaceAcl,
        'userId'
      >[]
    ).map((wsAcl) => wsAcl.userId)
  }

export const countWorkspaceRoleWithOptionalProjectRoleFactory =
  ({ db }: { db: Knex }): CountWorkspaceRoleWithOptionalProjectRole =>
  async ({ workspaceId, workspaceRole, projectRole, skipUserIds }) => {
    let query
    if (projectRole) {
      query = tables
        .streams(db)
        .join(StreamAcl.name, StreamAcl.col.resourceId, Streams.col.id)
        .join(DbWorkspaceAcl.name, DbWorkspaceAcl.col.userId, StreamAcl.col.userId)
        .where(Streams.col.workspaceId, workspaceId)
        .andWhere(DbWorkspaceAcl.col.role, workspaceRole)
        // make sure to also filter on the workspace_acl workspaceId, to not leak roles across
        .andWhere(DbWorkspaceAcl.col.workspaceId, workspaceId)
        .andWhere(StreamAcl.col.role, projectRole)
        .countDistinct(DbWorkspaceAcl.col.userId)
    } else {
      query = tables
        .workspacesAcl(db)
        .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
        .where(DbWorkspaceAcl.col.role, workspaceRole)
        .count()
    }

    if (skipUserIds) {
      query.whereNotIn(DbWorkspaceAcl.col.userId, skipUserIds)
    }

    const [res] = await query
    return parseInt(res.count.toString())
  }
