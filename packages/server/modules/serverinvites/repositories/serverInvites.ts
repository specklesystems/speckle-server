import { knex, ServerInvites, Streams, Users } from '@/modules/core/dbSchema'
import {
  getUserByEmailFactory,
  getUserFactory,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { resolveTarget, buildUserTarget } from '@/modules/serverinvites/helpers/core'
import { isObjectLike, uniq } from 'lodash-es'
import {
  ExtendedInvite,
  InviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { Knex } from 'knex'
import {
  CountServerInvites,
  DeleteAllResourceInvites,
  DeleteAllUserInvites,
  DeleteInvite,
  DeleteInvitesByTarget,
  DeleteServerOnlyInvites,
  FindInvite,
  FindInviteByToken,
  FindServerInvite,
  FindServerInvites,
  InsertInviteAndDeleteOld,
  MarkInviteUpdated,
  QueryAllResourceInvites,
  QueryAllUserResourceInvites,
  QueryInvites,
  QueryServerInvites,
  UpdateAllInviteTargets
} from '@/modules/serverinvites/domain/operations'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { isNonNullable, Optional } from '@speckle/shared'
import { LogicError } from '@/modules/shared/errors'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import { WorkspaceAcl, Workspaces } from '@/modules/workspacesCore/helpers/db'
import { Project } from '@/modules/core/domain/streams/types'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { formatJsonArrayRecords } from '@/modules/shared/helpers/dbHelper'

export type ServerInviteResourceFilter<
  Target extends InviteResourceTarget = InviteResourceTarget
> = {
  resourceId?: string
  resourceType: Target['resourceType']
}

type PreformattedExtendedInvite<
  Resource extends InviteResourceTarget = InviteResourceTarget
> = ServerInviteRecord<Resource> & {
  workspaces: Workspace[]
  projects: Project[]
}

export const filterByPrimaryResource = <Q extends Knex.QueryBuilder>(
  query: Q,
  filter: ServerInviteResourceFilter
) => {
  query.whereRaw(`?? ->> 'resourceType' = ?`, [
    ServerInvites.col.resource,
    filter.resourceType
  ])

  if (filter.resourceId) {
    query.whereRaw(`?? ->> 'resourceId' = ?`, [
      ServerInvites.col.resource,
      filter.resourceId
    ])
  }
}

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const buildInvitesBaseQuery =
  ({ db }: { db: Knex }) =>
  <Result extends PreformattedExtendedInvite[] = PreformattedExtendedInvite[]>(
    options?: Partial<{
      /**
       * Sort order. Defaults to 'asc'.
       */
      sort: 'asc' | 'desc'
    }>
  ) => {
    const { sort = 'asc' } = options || {}

    const query = db(ServerInvites.name)
      .select<Result>([
        ...ServerInvites.cols,
        Workspaces.groupArray('workspaces'),
        Streams.groupArray('projects')
      ])
      .orderBy(ServerInvites.col.updatedAt, sort)

    const RawServerInvites = ServerInvites.with({ quoted: true })
    const RawStreams = Streams.with({ quoted: true })
    const RawWorkspaces = Workspaces.with({ quoted: true })
    const RawWorkspaceAcl = WorkspaceAcl.with({ quoted: true })

    // Join streams for project invites
    query.leftJoin(
      knex.raw(
        `${RawStreams.name} ON 
          (${RawServerInvites.col.resource} ->> 'resourceType' = '${ProjectInviteResourceType}' AND ${RawServerInvites.col.resource} ->> 'resourceId' = ${RawStreams.col.id})
        `
      )
    )
    // Join workspaces for (even implicit) workspace invites
    query.leftJoin(
      knex.raw(
        `${RawWorkspaces.name} ON 
          (${RawServerInvites.col.resource} ->> 'resourceType' = '${WorkspaceInviteResourceType}' AND ${RawServerInvites.col.resource} ->> 'resourceId' = ${RawWorkspaces.col.id})
          OR (
            ${RawServerInvites.col.resource} ->> 'resourceType' = '${ProjectInviteResourceType}' AND ${RawServerInvites.col.resource} ->> 'resourceId' = ${RawStreams.col.id}
            AND ${RawStreams.col.workspaceId} = ${RawWorkspaces.col.id}
          )
        `
      )
    )

    // Join workspace acl so we can filter out implicit workspace invites for already existing workspace members
    query.leftJoin(
      knex.raw(
        `${RawWorkspaceAcl.name} ON 
          (${RawWorkspaceAcl.col.workspaceId} = ${RawWorkspaces.col.id} AND ${RawWorkspaceAcl.col.userId} = SUBSTRING(${RawServerInvites.col.target} FROM 2))
        `
      )
    )

    // Do validity checks so that we don't return invites for deleted projects/workspaces
    query.andWhere((w) => {
      w.andWhere((w2) => {
        w2.orWhereRaw(
          knex.raw(
            `(${RawServerInvites.col.resource} ->> 'resourceType' = '${ProjectInviteResourceType}' AND ${RawStreams.col.id} IS NOT NULL)`
          )
        )
          .orWhereRaw(
            knex.raw(
              `(${RawServerInvites.col.resource} ->> 'resourceType' = '${WorkspaceInviteResourceType}' AND ${RawWorkspaces.col.id} IS NOT NULL)`
            )
          )
          .orWhereRaw(
            knex.raw(
              `(${RawServerInvites.col.resource} ->> 'resourceType' = '${ServerInviteResourceType}')`
            )
          )
      })
    })

    query.groupBy(ServerInvites.col.id)

    return {
      query,
      /**
       * Allows filtering by resource and supports implicit invites and joins
       */
      filterByResource: <Q extends Knex.QueryBuilder>(
        query: Q,
        filter: ServerInviteResourceFilter
      ) => {
        const RawServerInvites = ServerInvites.with({ quoted: true })
        const RawWorkspaces = Workspaces.with({ quoted: true })

        const isWorkspaceInvite = filter.resourceType === WorkspaceInviteResourceType
        if (!isWorkspaceInvite) {
          // Just look for this explicit type and (optionally) id
          query.whereRaw(`?? ->> 'resourceType' = ?`, [
            ServerInvites.col.resource,
            filter.resourceType
          ])

          if (filter.resourceId) {
            query.whereRaw(`?? ->> 'resourceId' = ?`, [
              ServerInvites.col.resource,
              filter.resourceId
            ])
          }
          return
        } else {
          // If workspace invite, we also look for workspace project invites as implicit workspace invites
          query.where((w) => {
            w.orWhereRaw(
              knex.raw(
                `${RawServerInvites.col.resource} ->> 'resourceType' = '${ProjectInviteResourceType}' AND ${RawWorkspaces.col.id} IS NOT NULL AND ${RawWorkspaceAcl.col.userId} IS NULL`
              )
            ).orWhereRaw(
              knex.raw(
                `${RawServerInvites.col.resource} ->> 'resourceType' = '${WorkspaceInviteResourceType}'`
              )
            )
          })

          if (filter.resourceId) {
            query.andWhere(Workspaces.col.id, filter.resourceId)
          }
        }
      }
    }
  }

const formatIntoExtendedInvite = <
  Resource extends InviteResourceTarget = InviteResourceTarget
>(
  invite: PreformattedExtendedInvite<Resource>
): ExtendedInvite<Resource> => {
  const { workspaces, projects, ...rest } = invite
  return {
    ...rest,
    workspace: formatJsonArrayRecords(workspaces)[0] as Optional<Workspace>,
    project: formatJsonArrayRecords(projects)[0] as Optional<Project>
  }
}

/**
 * Try to find a user using the target value
 */
export const findUserByTargetFactory =
  (deps: { db: Knex }) =>
  (target: string): Promise<UserWithOptionalRole | null> => {
    const { userEmail, userId } = resolveTarget(target)
    return userEmail
      ? getUserByEmailFactory(deps)(userEmail, { withRole: true })
      : getUserFactory(deps)(userId!, { withRole: true })
  }

/**
 * Insert a new invite and delete the old ones
 * If there are alternate targets for the same user
 * (e.g. user ID & email), you can specify them to ensure those will be cleaned up
 * also
 */
export const insertInviteAndDeleteOldFactory =
  ({ db }: { db: Knex }): InsertInviteAndDeleteOld =>
  async (invite, alternateTargets = []) => {
    const allTargets = uniq(
      [invite.target, ...alternateTargets].map((t) => t.toLowerCase())
    )

    // Delete old
    const deleteQ = db<ServerInviteRecord>(ServerInvites.name)
      .where((q) => filterByPrimaryResource(q, invite.resource))
      .whereIn(ServerInvites.col.target, allTargets)
      .delete()

    const deleted = (await deleteQ) || 0

    // Insert new
    invite.target = invite.target.toLowerCase() // Extra safety cause our schema is case sensitive
    const [newInvite] = await db<ServerInviteRecord>(ServerInvites.name).insert(
      invite,
      '*'
    )
    return { deleted, invite: newInvite }
  }

export const queryAllUserResourceInvitesFactory =
  ({ db }: { db: Knex }): QueryAllUserResourceInvites =>
  async <Target extends InviteResourceTarget = InviteResourceTarget>(params: {
    userId: string
    resourceType: Target['resourceType']
  }) => {
    const { userId, resourceType } = params
    if (!userId) return []

    const target = buildUserTarget(userId)

    const { query, filterByResource } = buildInvitesBaseQuery({ db })<
      PreformattedExtendedInvite<Target>[]
    >()

    query
      .where({
        [ServerInvites.col.target]: target
      })
      .where((q) =>
        filterByResource(q, {
          resourceType
        })
      )
    const res = await query

    return res.map(formatIntoExtendedInvite)
  }

export const findServerInviteFactory =
  ({ db }: { db: Knex }): FindServerInvite =>
  async (email, token) => {
    if (!email && !token) return null

    const { query } = buildInvitesBaseQuery({ db })()

    if (email) {
      query.andWhere({
        [ServerInvites.col.target]: email.toLowerCase()
      })
    }

    if (token) {
      query.andWhere(ServerInvites.col.token, token)
    }

    const res = (await query.first()) || null
    return res ? formatIntoExtendedInvite(res) : null
  }

export const queryAllResourceInvitesFactory =
  ({ db }: { db: Knex }): QueryAllResourceInvites =>
  async <Target extends InviteResourceTarget = InviteResourceTarget>(
    filter: Pick<Target, 'resourceId' | 'resourceType'> & { search?: string }
  ) => {
    if (!filter.resourceId) return []

    const { query, filterByResource } = buildInvitesBaseQuery({ db })<
      PreformattedExtendedInvite<Target>[]
    >()

    query.where((q) => filterByResource(q, filter))

    if (filter.search) {
      query
        .leftJoin(
          Users.name,
          Users.col.id,
          knex.raw('SUBSTRING(?? FROM 2)', [ServerInvites.col.target])
        )
        .where((w1) => {
          w1.where(ServerInvites.col.target, 'ILIKE', `%${filter.search}%`).orWhere(
            Users.col.name,
            'ILIKE',
            `%${filter.search}%`
          )
        })
    }

    const res = await query
    return res.map(formatIntoExtendedInvite)
  }

export const deleteAllResourceInvitesFactory =
  ({ db }: { db: Knex }): DeleteAllResourceInvites =>
  async <Target extends InviteResourceTarget = InviteResourceTarget>(
    filter: Pick<Target, 'resourceId' | 'resourceType'>
  ) => {
    if (!filter.resourceId) return false

    await db(ServerInvites.name)
      .where((q) => filterByPrimaryResource(q, filter))
      .delete()
    return true
  }

export const deleteServerOnlyInvitesFactory =
  ({ db }: { db: Knex }): DeleteServerOnlyInvites =>
  async (email) => {
    if (!email) return

    return db<ServerInviteRecord>(ServerInvites.name)
      .where((q) =>
        filterByPrimaryResource(q, { resourceType: ServerInviteResourceType })
      )
      .where({
        [ServerInvites.col.target]: email.toLowerCase()
      })
      .delete()
  }

export const updateAllInviteTargetsFactory =
  ({ db }: { db: Knex }): UpdateAllInviteTargets =>
  async (oldTargets, newTarget) => {
    if (!oldTargets || !newTarget) return
    oldTargets = Array.isArray(oldTargets) ? oldTargets : [oldTargets]
    oldTargets = oldTargets.map((t) => t.toLowerCase())
    if (!oldTargets.length) return

    // PostgreSQL doesn't support aliases in update calls
    const ServerInvitesCols = ServerInvites.with({ withoutTablePrefix: true }).col
    return db(ServerInvites.name)
      .whereIn(ServerInvitesCols.target, oldTargets)
      .update(ServerInvitesCols.target, newTarget.toLowerCase())
  }

const findServerInvitesBaseQueryFactory =
  ({ db }: { db: Knex }) =>
  (searchQuery: string | null, sort: 'asc' | 'desc' = 'asc'): Knex.QueryBuilder => {
    const { query } = buildInvitesBaseQuery({ db })({ sort })

    if (searchQuery) {
      // TODO: Is this safe from SQL injection?
      query.andWhere(ServerInvites.col.target, 'ILIKE', `%${searchQuery}%`)
    }

    // Not an invite for an already registered user
    query.andWhere(ServerInvites.col.target, 'NOT ILIKE', '@%')
    return query
  }

export const countServerInvitesFactory =
  ({ db }: { db: Knex }): CountServerInvites =>
  async (searchQuery) => {
    const q = findServerInvitesBaseQueryFactory({ db })(searchQuery)
    const [count] = await db()
      .count()
      .from((q as Knex.QueryBuilder).as('sq1'))
    return parseInt(count.count.toString())
  }

export const findServerInvitesFactory =
  ({ db }: { db: Knex }): FindServerInvites =>
  async (searchQuery, limit, offset) => {
    const q = findServerInvitesBaseQueryFactory({ db })(
      searchQuery
    ) as Knex.QueryBuilder
    return q.limit(limit).offset(offset) as Promise<ServerInviteRecord[]>
  }

export const queryServerInvitesFactory =
  ({ db }: { db: Knex }): QueryServerInvites =>
  async (searchQuery, limit, cursor) => {
    const q = findServerInvitesBaseQueryFactory({ db })(searchQuery, 'desc')
    q.limit(limit)

    if (cursor) q.where(ServerInvites.col.createdAt, '<', cursor.toISOString())
    return (await q) as ServerInviteRecord[]
  }

export const findInviteFactory =
  ({ db }: { db: Knex }): FindInvite =>
  async <Target extends InviteResourceTarget = InviteResourceTarget>(params: {
    inviteId?: string
    token?: string
    target?: string
    resourceFilter?: ServerInviteResourceFilter<Target>
  }) => {
    if (!isObjectLike(params)) {
      throw new LogicError('Invalid params - expected a params object')
    }
    if (!Object.values(params).filter(isNonNullable).length) return null
    const { inviteId, target, token, resourceFilter } = params

    const { query, filterByResource } = buildInvitesBaseQuery({ db })<
      PreformattedExtendedInvite<Target>[]
    >()

    if (inviteId) {
      query.where(ServerInvites.col.id, inviteId)
    }

    if (target) {
      query.where(ServerInvites.col.target, target)
    }

    if (token) {
      query.where(ServerInvites.col.token, token)
    }

    if (resourceFilter) {
      query.where((w1) => filterByResource(w1, resourceFilter))
    }

    const res = (await query.first()) || null
    return res ? formatIntoExtendedInvite(res) : null
  }

export const deleteInviteFactory =
  ({ db }: { db: Knex }): DeleteInvite =>
  async (inviteId) => {
    if (!inviteId) return false
    await db(ServerInvites.name).where(ServerInvites.col.id, inviteId).delete()
    return true
  }

/**
 * Delete invites by target - useful when there are potentially duplicate invites that need cleaning up
 * (e.g. same target, but multiple inviters)
 */
export const deleteInvitesByTargetFactory =
  ({ db }: { db: Knex }): DeleteInvitesByTarget =>
  async (targets, resourceType, resourceId) => {
    if (!targets) return false
    targets = Array.isArray(targets) ? targets : [targets]
    if (!targets.length) return false

    await db(ServerInvites.name)
      .where((q) => filterByPrimaryResource(q, { resourceType, resourceId }))
      .whereIn(ServerInvites.col.target, targets)
      .delete()

    return true
  }

export const queryInvitesFactory =
  ({ db }: { db: Knex }): QueryInvites =>
  async (inviteIds) => {
    if (!inviteIds?.length) return []
    const { query: query } = buildInvitesBaseQuery({ db })()
    query.whereIn(ServerInvites.col.id, inviteIds)

    const ret = await query
    return ret.map(formatIntoExtendedInvite)
  }

export const deleteAllUserInvitesFactory =
  ({ db }: { db: Knex }): DeleteAllUserInvites =>
  async (userId) => {
    if (!userId) return false
    await db(ServerInvites.name)
      .where(ServerInvites.col.target, buildUserTarget(userId))
      .delete()
    return true
  }

export const findInviteByTokenFactory =
  ({ db }: { db: Knex }): FindInviteByToken =>
  async ({ token }) => {
    if (!token?.length) return null
    const { query: query } = buildInvitesBaseQuery({ db })()
    query.where(ServerInvites.col.token, token)

    const ret = (await query.first()) || null
    return ret ? formatIntoExtendedInvite(ret) : null
  }

export const markInviteUpdatedFactory =
  ({ db }: { db: Knex }): MarkInviteUpdated =>
  async ({ inviteId }) => {
    const cols = ServerInvites.with({ withoutTablePrefix: true }).col
    const ret = await db(ServerInvites.name)
      .where(ServerInvites.col.id, inviteId)
      .update(cols.updatedAt, new Date())
    return !!ret
  }
