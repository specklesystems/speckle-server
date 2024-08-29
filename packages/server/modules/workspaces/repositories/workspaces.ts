import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import {
  CountProjectsVersionsByWorkspaceId,
  CountWorkspaceRoleWithOptionalProjectRole,
  DeleteWorkspace,
  DeleteWorkspaceDomain,
  DeleteWorkspaceRole,
  GetUserDiscoverableWorkspaces,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceDomains,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRolesCount,
  GetWorkspaceRolesForUser,
  GetWorkspaceWithDomains,
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
  WorkspaceDomains,
  Workspaces
} from '@/modules/workspaces/helpers/db'
import {
  knex,
  ServerAcl,
  ServerInvites,
  StreamAcl,
  StreamCommits,
  Streams,
  Users
} from '@/modules/core/dbSchema'
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

export const getUserDiscoverableWorkspacesFactory =
  ({ db }: { db: Knex }): GetUserDiscoverableWorkspaces =>
  async ({ domains, userId }) => {
    if (domains.length === 0) {
      return []
    }
    return (await tables
      .workspaces(db)
      .select('workspaces.id as id', 'name', 'description', 'logo', 'defaultLogoIndex')
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
      'id' | 'name' | 'description' | 'logo' | 'defaultLogoIndex'
    >[]
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
      .merge([
        'description',
        'logo',
        'defaultLogoIndex',
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
  async ({ workspaceId, filter = {} }) => {
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

    const { search, role } = filter || {}

    if (search) {
      query
        .where(Users.col.name, 'ILIKE', `%${search}%`)
        .orWhere(Users.col.email, 'ILIKE', `%${search}%`)
    }

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

export const countProjectsVersionsByWorkspaceIdFactory =
  ({ db }: { db: Knex }): CountProjectsVersionsByWorkspaceId =>
  async ({ workspaceId }) => {
    const [res] = await tables
      .streams(db)
      .join(StreamCommits.name, StreamCommits.col.streamId, Streams.col.id)
      .where({ workspaceId })
      .count(StreamCommits.col.commitId)

    return parseInt(res.count.toString())
  }

export const getWorkspaceRolesCountFactory =
  ({ db }: { db: Knex }): GetWorkspaceRolesCount =>
  async ({ workspaceId }) => {
    const result = await db.raw<{
      rows: [{ admins: string; members: string; guests: string; viewers: string }]
    }>(
      `
  SELECT
    SUM(CASE WHEN wa.role = 'workspace:admin' THEN 1 ELSE 0 END) AS admins,
    SUM(CASE WHEN wa.role = 'workspace:member' THEN 1 ELSE 0 END) AS members,
    SUM(CASE WHEN wa.role = 'workspace:guest' AND sa."userId" IS NOT NULL THEN 1 ELSE 0 END) AS guests,
    SUM(CASE WHEN wa.role = 'workspace:guest' AND sa."userId" IS NULL THEN 1 ELSE 0 END) AS viewers
  FROM
    workspace_acl wa
  LEFT JOIN
    (
      SELECT DISTINCT sa."userId"
      FROM stream_acl sa
      WHERE sa.role = 'stream:contributor' OR sa.role = 'stream:owner'
    ) sa
  ON
    wa."userId" = sa."userId"
  WHERE
    wa."workspaceId" = ?
`,
      [workspaceId]
    )

    const defaultCounts = {
      admins: 0,
      members: 0,
      guests: 0,
      viewers: 0
    }

    if (!result.rows[0]) {
      return defaultCounts
    }

    const row = result.rows[0]
    const counts = (Object.keys(row) as Array<keyof typeof row>)
      .filter((key) => row[key])
      .reduce((acc, key) => ({ ...acc, [key]: parseInt(row[key]) }), {})

    return { ...defaultCounts, ...counts }
  }

export const countWorkspaceRoleWithOptionalProjectRoleFactory =
  ({ db }: { db: Knex }): CountWorkspaceRoleWithOptionalProjectRole =>
  async ({ workspaceId, workspaceRole, projectRole }) => {
    const query = tables
      .workspacesAcl(db)
      .where(DbWorkspaceAcl.col.workspaceId, workspaceId)
      .where(DbWorkspaceAcl.col.role, workspaceRole)
      .countDistinct(DbWorkspaceAcl.col.userId)

    if (projectRole)
      query
        .join(Streams.name, Streams.col.workspaceId, DbWorkspaceAcl.col.workspaceId)
        .join(StreamAcl.name, StreamAcl.col.resourceId, Streams.col.id)
        .andWhere(StreamAcl.col.role, projectRole)

    const [res] = await query

    return parseInt((res as unknown as { count: string | number }).count.toString())
  }
