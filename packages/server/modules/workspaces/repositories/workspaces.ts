import type {
  LimitedWorkspace,
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceJoinRequest,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import type {
  CountDomainsByWorkspaceId,
  CountWorkspaceRoleWithOptionalProjectRole,
  CountWorkspaces,
  DeleteWorkspace,
  DeleteWorkspaceDomain,
  DeleteWorkspaceRole,
  EligibleWorkspace,
  GetAllWorkspaces,
  GetPaginatedWorkspaceProjects,
  GetPaginatedWorkspaceProjectsArgs,
  GetPaginatedWorkspaceProjectsItems,
  GetPaginatedWorkspaceProjectsTotalCount,
  GetUserDiscoverableWorkspaces,
  GetUsersCurrentAndEligibleToBecomeAMemberWorkspaces,
  GetUserIdsWithRoleInWorkspace,
  GetWorkspace,
  GetWorkspaceBySlug,
  GetWorkspaceBySlugOrId,
  GetWorkspaceCollaborators,
  GetWorkspaceCollaboratorsBaseArgs,
  GetWorkspaceCollaboratorsTotalCount,
  GetWorkspaceCreationState,
  GetWorkspaceDomains,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesForUser,
  GetWorkspaceSeatCount,
  GetWorkspaceWithDomains,
  GetWorkspaces,
  GetWorkspacesNonComplete,
  GetWorkspacesProjectsCounts,
  GetWorkspacesRolesForUsers,
  QueryWorkspaces,
  StoreWorkspaceDomain,
  UpsertWorkspace,
  UpsertWorkspaceCreationState,
  UpsertWorkspaceRole,
  BulkUpsertWorkspaces
} from '@/modules/workspaces/domain/operations'
import type { Knex } from 'knex'
import { isNullOrUndefined, Roles } from '@speckle/shared'
import type {
  ServerAclRecord,
  BranchRecord,
  StreamAclRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  WorkspaceAcl as DbWorkspaceAcl,
  WorkspaceCreationState as DbWorkspaceCreationState,
  WorkspaceDomains,
  Workspaces,
  WorkspaceSeats
} from '@/modules/workspaces/helpers/db'
import {
  knex,
  ServerAcl,
  ServerInvites,
  StreamAcl,
  Streams,
  UserEmails,
  Users
} from '@/modules/core/dbSchema'
import type { UserRecord } from '@/modules/core/helpers/userHelper'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'

import { clamp, has, isObjectLike } from 'lodash-es'
import type {
  WorkspaceCreationState,
  WorkspaceTeamMember
} from '@/modules/workspaces/domain/types'
import {
  compositeCursorTools,
  decodeCompositeCursor,
  decodeCursor,
  encodeCompositeCursor,
  encodeCursor
} from '@/modules/shared/helpers/dbHelper'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'

const tables = {
  users: (db: Knex) => db<UserRecord>(Users.name),
  branches: (db: Knex) => db<BranchRecord>('branches'),
  streams: (db: Knex) => db<StreamRecord>('streams'),
  streamAcl: (db: Knex) => db<StreamAclRecord>('stream_acl'),
  serverAcl: (db: Knex) => db<ServerAclRecord>(ServerAcl.name),
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspaceDomains: (db: Knex) => db<WorkspaceDomain>('workspace_domains'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl'),
  workspaceCreationState: (db: Knex) =>
    db<WorkspaceCreationState>('workspace_creation_state'),
  workspaceJoinRequests: (db: Knex) =>
    db<WorkspaceJoinRequest>('workspace_join_requests')
}

export const getUserEligibleWorkspacesFactory =
  ({ db }: { db: Knex }): GetUsersCurrentAndEligibleToBecomeAMemberWorkspaces =>
  async ({ userId, domains }) => {
    const q = tables
      .workspaces(db)
      .distinctOn(Workspaces.col.id)
      .select<EligibleWorkspace[]>([...Workspaces.cols, DbWorkspaceAcl.col.role])
      .joinRaw(
        `left join ${DbWorkspaceAcl.name}
        on ${Workspaces.col.id} = ${DbWorkspaceAcl.name}."${DbWorkspaceAcl.withoutTablePrefix.col.workspaceId}"
        and ${DbWorkspaceAcl.name}."${DbWorkspaceAcl.withoutTablePrefix.col.userId}" = '${userId}'`
      )
      .joinRaw(
        `left join ${ServerInvites.name}
        on ${Workspaces.col.id} = ${ServerInvites.col.resource} ->> 'resourceId'
        and ${ServerInvites.col.target} = '@${userId}'`
      )
      .leftJoin(
        WorkspaceDomains.name,
        WorkspaceDomains.col.workspaceId,
        Workspaces.col.id
      )
      .whereNotNull(DbWorkspaceAcl.col.userId)
      .orWhereNotNull(ServerInvites.col.target)
    if (domains.length)
      q.orWhere(function () {
        this.where(Workspaces.col.discoverabilityEnabled, true)
        this.whereIn(WorkspaceDomains.col.domain, domains)
      })
    const items = await q
    return items
  }

export const getUserDiscoverableWorkspacesFactory =
  ({ db }: { db: Knex }): GetUserDiscoverableWorkspaces =>
  async ({ domains, userId }) => {
    if (domains.length === 0) {
      return []
    }

    const workspaces = (await tables
      .workspaces(db)
      .select(
        'workspaces.id as id',
        'name',
        'slug',
        'description',
        'logo',
        'discoverabilityAutoJoinEnabled',
        'isExclusive',
        tables
          .workspacesAcl(db)
          .select(knex.raw('count(*)::integer'))
          .where(DbWorkspaceAcl.col.workspaceId, knex.ref(Workspaces.col.id))
          .as('teamCount')
      )
      .distinctOn(['teamCount', 'workspaces.id'])
      .join('workspace_domains', 'workspace_domains.workspaceId', 'workspaces.id')
      .leftJoin(
        tables.workspacesAcl(db).select('*').where({ userId }).as('acl'),
        'acl.workspaceId',
        'workspaces.id'
      )
      .leftJoin(
        tables
          .workspaceJoinRequests(db)
          .select('*')
          .where({ userId })
          .as('joinRequest'),
        'joinRequest.workspaceId',
        'workspaces.id'
      )
      .whereNull('joinRequest.workspaceId')
      .whereIn('domain', domains)
      .where('discoverabilityEnabled', true)
      .where('verified', true)
      .where('role', null)
      .orderBy([
        { column: 'teamCount', order: 'desc' },
        'workspaces.id'
      ])) as LimitedWorkspace[]

    return workspaces
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
  async ({ workspaceIds, userId, search, completed }) => {
    const q = workspaceWithRoleBaseQuery({ db, userId })
    if (workspaceIds !== undefined) q.whereIn(Workspaces.col.id, workspaceIds)

    if (search) {
      q.andWhere((builder) => {
        builder
          .where('name', 'ILIKE', `%${search}%`)
          .orWhere('slug', 'ILIKE', `%${search}%`)
      })
    }

    if (completed !== undefined) {
      q.leftJoin(
        DbWorkspaceCreationState.name,
        Workspaces.col.id,
        DbWorkspaceCreationState.col.workspaceId
      ).andWhere((builder) => {
        builder
          .where({ [DbWorkspaceCreationState.col.completed]: completed })
          .orWhere({ [DbWorkspaceCreationState.col.completed]: null })
      })
    }

    const results = await q
    return results
  }

export const getWorkspacesBySlugFactory =
  (deps: { db: Knex }) =>
  async (params: { workspaceSlugs: string[]; userId?: string }) => {
    const { db } = deps
    const q = workspaceWithRoleBaseQuery({ db, userId: params.userId }).whereIn(
      Workspaces.col.slug,
      params.workspaceSlugs
    )

    const results = await q
    return results
  }

export const getAllWorkspacesFactory =
  ({ db }: { db: Knex }): GetAllWorkspaces =>
  async (args) => {
    const cursor = args.cursor ? decodeCursor(args.cursor) : null
    const limit = isNullOrUndefined(args.limit) ? 10 : args.limit

    const q = tables
      .workspaces(db)
      .limit(clamp(limit, 1, 500))
      .orderBy(Workspaces.col.id, 'asc')

    if (cursor?.length) {
      q.andWhere(Workspaces.col.id, '>', cursor)
    }

    const res = await q

    return {
      items: res,
      cursor: res.length ? encodeCursor(res[res.length - 1].id) : null
    }
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

const buildWorkspacesQuery = ({ db, search }: { db: Knex; search?: string }) => {
  const query = tables.workspaces(db)

  if (search) {
    query.andWhere((builder) => {
      builder
        .where('name', 'ILIKE', `%${search}%`)
        .orWhere('slug', 'ILIKE', `%${search}%`)
    })
  }
  return query
}

export const queryWorkspacesFactory =
  ({ db }: { db: Knex }): QueryWorkspaces =>
  async ({ limit, cursor, filter }) => {
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: Workspaces,
      cols: ['createdAt', 'id']
    })

    const query = buildWorkspacesQuery({ db, search: filter?.search })
      .select()
      .limit(limit)

    applyCursorSortAndFilter({
      query,
      cursor
    })

    const res = await query
    const newCursor = resolveNewCursor(res)

    return { items: res, cursor: newCursor }
  }

export const countWorkspacesFactory =
  ({ db }: { db: Knex }): CountWorkspaces =>
  async ({ filter }) => {
    const query = buildWorkspacesQuery({ db, search: filter?.search })

    const [res] = await query.count()
    const count = parseInt(res.count.toString())
    return count
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
        'name',
        'updatedAt',
        'domainBasedMembershipProtectionEnabled',
        'discoverabilityEnabled',
        'discoverabilityAutoJoinEnabled',
        'defaultSeatType',
        'isEmbedSpeckleBrandingHidden',
        'isExclusive'
      ])
  }

export const bulkUpsertWorkspacesFactory =
  ({ db }: { db: Knex }): BulkUpsertWorkspaces =>
  async ({ workspaces }) => {
    if (!workspaces.length) return
    await tables.workspaces(db).insert(workspaces).onConflict('id').merge()
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

export const getWorkspacesRolesForUsersFactory =
  (deps: { db: Knex }): GetWorkspacesRolesForUsers =>
  async (reqs) => {
    const query = tables.workspacesAcl(deps.db).whereIn(
      [DbWorkspaceAcl.col.userId, DbWorkspaceAcl.col.workspaceId],
      reqs.map(({ userId, workspaceId }) => [userId, workspaceId])
    )
    const results = await query

    return results.reduce((acc, acl) => {
      const { userId, workspaceId } = acl
      if (!acc[workspaceId]) {
        acc[workspaceId] = {}
      }

      acc[workspaceId][userId] = acl
      return acc
    }, {} as Awaited<ReturnType<GetWorkspacesRolesForUsers>>)
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

const getWorkspaceCollaboratorsBaseQuery =
  (deps: { db: Knex }) => (params: GetWorkspaceCollaboratorsBaseArgs) => {
    const { workspaceId, filter = {} } = params

    const query = tables
      .users(deps.db)
      .select<Array<WorkspaceTeamMember & { workspaceRoleCreatedAt: Date }>>(
        ...Users.cols,
        ServerAcl.col.role,
        DbWorkspaceAcl.col.workspaceId, // this field is necessary for projectRoles field resolver
        DbWorkspaceAcl.colAs('role', 'workspaceRole'),
        DbWorkspaceAcl.colAs('createdAt', 'workspaceRoleCreatedAt')
      )
      .join(DbWorkspaceAcl.name, DbWorkspaceAcl.col.userId, Users.col.id)
      .join(UserEmails.name, Users.col.id, UserEmails.col.userId)
      .join(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      // this will only get the primary email of a user
      // if the user has a secondary email matching the workspace's domain
      // it will not be surfaced by this query
      //
      .andWhere(UserEmails.col.primary, true)

    const { search, roles, seatType, excludeUserIds } = filter || {}

    if (seatType) {
      query
        .join('workspace_seats', 'workspace_seats.userId', DbWorkspaceAcl.col.userId)
        .andWhere('workspace_seats.type', seatType)
        .andWhere('workspace_seats.workspaceId', workspaceId)
    }

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

    if (excludeUserIds?.length) {
      query.andWhere((w) => {
        w.whereNotIn(Users.col.id, excludeUserIds)
      })
    }

    return query
  }

export const getWorkspaceCollaboratorsTotalCountFactory =
  ({ db }: { db: Knex }): GetWorkspaceCollaboratorsTotalCount =>
  async (params) => {
    const q = db
      .from(getWorkspaceCollaboratorsBaseQuery({ db })(params).as('t1'))
      .count()

    const [res] = await q
    const count = parseInt(res.count + '')
    return count || 0
  }

export const getWorkspaceCollaboratorsFactory =
  ({ db }: { db: Knex }): GetWorkspaceCollaborators =>
  async (params) => {
    const { limit = 25, hasAccessToEmail } = params
    const query = getWorkspaceCollaboratorsBaseQuery({ db })(params)
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: {
        col: {
          workspaceRoleCreatedAt: DbWorkspaceAcl.col.createdAt,
          id: Users.col.id
        }
      },
      cols: ['workspaceRoleCreatedAt', 'id']
    })

    applyCursorSortAndFilter({
      query,
      cursor: params.cursor
    })

    if (limit) {
      query.limit(clamp(limit, 0, 100))
    }

    const items = (await query).map((i) => ({
      ...removePrivateFields(i),
      email: hasAccessToEmail ? i.email : null,
      workspaceRole: i.workspaceRole,
      workspaceRoleCreatedAt: i.workspaceRoleCreatedAt,
      workspaceId: i.workspaceId,
      role: i.role
    }))
    const newCursor = resolveNewCursor(items)

    return { items, cursor: newCursor }
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

export const getWorkspacesNonCompleteFactory =
  ({ db }: { db: Knex }): GetWorkspacesNonComplete =>
  async ({ createdAtBefore }) => {
    return tables
      .workspaceCreationState(db)
      .where({ [DbWorkspaceCreationState.col.completed]: false })
      .innerJoin(
        Workspaces.name,
        Workspaces.col.id,
        DbWorkspaceCreationState.col.workspaceId
      )
      .where(Workspaces.col.createdAt, '<', createdAtBefore.toISOString())
      .select([DbWorkspaceCreationState.col.workspaceId])
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

export const getWorkspaceSeatCountFactory =
  ({ db }: { db: Knex }): GetWorkspaceSeatCount =>
  async ({ workspaceId, type }) => {
    const query = db(WorkspaceSeats.name).where(
      WorkspaceSeats.col.workspaceId,
      workspaceId
    )

    if (type) query.andWhere(WorkspaceSeats.col.type, type)

    const [{ count }] = await query.count()

    return parseInt(String(count))
  }

export const getWorkspaceCreationStateFactory =
  ({ db }: { db: Knex }): GetWorkspaceCreationState =>
  async ({ workspaceId }) => {
    const creationState = await tables
      .workspaceCreationState(db)
      .select()
      .where({ workspaceId })
      .first()
    return creationState || null
  }

export const upsertWorkspaceCreationStateFactory =
  ({ db }: { db: Knex }): UpsertWorkspaceCreationState =>
  async ({ workspaceCreationState }) => {
    await tables
      .workspaceCreationState(db)
      .insert(workspaceCreationState)
      .onConflict('workspaceId')
      .merge()
  }

export const getWorkspacesProjectsCountsFactory =
  (deps: { db: Knex }): GetWorkspacesProjectsCounts =>
  async ({ workspaceIds }) => {
    const ret = workspaceIds.reduce((acc, workspaceId) => {
      acc[workspaceId] = 0
      return acc
    }, {} as Record<string, number>)

    const q = tables
      .streams(deps.db)
      .select<
        {
          workspaceId: string
          count: string
        }[]
      >([Streams.col.workspaceId, knex.raw('count(*) as count')])
      .whereIn(Streams.col.workspaceId, workspaceIds)
      .groupBy(Streams.col.workspaceId)

    const res = await q

    for (const { workspaceId, count } of res) {
      ret[workspaceId] = parseInt(count)
    }

    return ret
  }

const getPaginatedWorkspaceProjectsBaseQueryFactory =
  (deps: { db: Knex }) =>
  (params: Omit<GetPaginatedWorkspaceProjectsArgs, 'cursor' | 'limit'>) => {
    const { workspaceId, userId, filter } = params
    const { search, withProjectRoleOnly } = filter || {}

    const query = tables
      .streams(deps.db)
      .where(Streams.col.workspaceId, workspaceId)
      .select<StreamRecord[]>(Streams.cols)

    /**
     * If userId is set:
     * - If no workspace role, user should be server admin w/ admin override enabled
     * - If workspace role is admin: user can get all workspace streams
     * - If workspace role is guest: user should have explicit stream roles
     * - If workspace role is member:
     *  - Public/Workspace visibility: get stream
     *  - Private visibility: user should have explicit stream roles
     *
     * If withProjectRoleOnly is set: Require project role always
     */
    if (userId) {
      query
        .leftJoin(DbWorkspaceAcl.name, (j) => {
          j.on(DbWorkspaceAcl.col.workspaceId, Streams.col.workspaceId).andOnVal(
            DbWorkspaceAcl.col.userId,
            userId
          )
        })
        .andWhere((w) => {
          // Check server_acl exist first, so subsequent checks can be optimized away
          if (adminOverrideEnabled() && !withProjectRoleOnly) {
            w.whereExists(
              tables
                .serverAcl(deps.db)
                .select('*')
                .where(ServerAcl.col.userId, userId)
                .andWhere(ServerAcl.col.role, Roles.Server.Admin)
            )
          }

          w.orWhere((w2) => {
            // Ensure workspace role exists and:
            // user has explicit stream role or is admin or is a non-guest in a non-private project
            w2.whereNotNull(DbWorkspaceAcl.col.role).andWhere((w3) => {
              if (!withProjectRoleOnly) {
                w3.where(DbWorkspaceAcl.col.role, Roles.Workspace.Admin).orWhere(
                  (w4) => {
                    w4.whereNot(
                      DbWorkspaceAcl.col.role,
                      Roles.Workspace.Guest
                    ).andWhereNot(
                      Streams.col.visibility,
                      ProjectRecordVisibility.Private
                    )
                  }
                )
              }

              w3.orWhereExists(
                tables
                  .streamAcl(deps.db)
                  .select('*')
                  .where(StreamAcl.col.userId, userId)
                  .andWhere(StreamAcl.col.resourceId, knex.ref(Streams.col.id))
              )
            })
          })
        })
    }

    if (search?.length) {
      query.andWhere((w) => {
        w.where(Streams.col.name, 'ILIKE', `%${search}%`).orWhere(
          Streams.col.description,
          'ILIKE',
          `%${search}%`
        )
      })
    }

    return query
  }

export const getPaginatedWorkspaceProjectsItemsFactory =
  (deps: { db: Knex }): GetPaginatedWorkspaceProjectsItems =>
  async (params) => {
    type CursorType = { updatedAt: string; id: string }
    const query = getPaginatedWorkspaceProjectsBaseQueryFactory(deps)(params)

    const limit = clamp(params.limit || 25, 1, 50)
    const cursor = decodeCompositeCursor<CursorType>(
      params.cursor,
      (c) => isObjectLike(c) && has(c, 'id') && has(c, 'updatedAt')
    )

    if (cursor) {
      // filter by date, and if there's duplicate dates, filter by id too
      query.andWhereRaw('(??, ??) < (?, ?)', [
        Streams.col.updatedAt,
        Streams.col.id,
        cursor.updatedAt,
        cursor.id
      ])
    }

    query
      .orderBy([
        { column: Streams.col.updatedAt, order: 'desc' },
        { column: Streams.col.id, order: 'desc' }
      ])
      .limit(limit)

    const rows = await query
    const newCursorRow = rows.at(-1)
    const newCursor = newCursorRow
      ? encodeCompositeCursor<CursorType>({
          updatedAt: newCursorRow.updatedAt.toISOString(),
          id: newCursorRow.id
        })
      : null

    return {
      items: rows,
      cursor: newCursor
    }
  }

export const getPaginatedWorkspaceProjectsTotalCountFactory =
  (deps: { db: Knex }): GetPaginatedWorkspaceProjectsTotalCount =>
  async (params) => {
    const query = getPaginatedWorkspaceProjectsBaseQueryFactory(deps)(params)
    const [res] = await query.clearSelect().count()
    const count = parseInt(res.count.toString())
    return count
  }

export const getPaginatedWorkspaceProjectsFactory =
  (deps: { db: Knex }): GetPaginatedWorkspaceProjects =>
  async (params) => {
    const getItems = getPaginatedWorkspaceProjectsItemsFactory(deps)
    const getTotalCount = getPaginatedWorkspaceProjectsTotalCountFactory(deps)

    const [items, totalCount] = await Promise.all([
      params.limit !== 0 ? getItems(params) : undefined,
      getTotalCount(params)
    ])

    if (!items) {
      return {
        items: [],
        cursor: null,
        totalCount
      }
    }

    return {
      ...items,
      totalCount
    }
  }

export const getAllWorkspaceChecksumFactory =
  ({ db }: { db: Knex }): (() => Promise<string>) =>
  async () => {
    // Build the row-level hash expression
    const rowConcatExpr = Workspaces.cols
      .map((col) => `COALESCE(${db.raw('??', [col])}::text, '')`)
      .join(` || '|' || `)
    const result = await db.raw<{ rows: [{ table_checksum: string }] }>(`
    SELECT md5(string_agg(row_hash, '')) AS table_checksum
    FROM (
      SELECT md5(${rowConcatExpr}) AS row_hash
      FROM ${Workspaces.name}
      ORDER BY ${Workspaces.col.id}
    ) AS hashed_rows;
  `)
    return result.rows[0].table_checksum
  }
