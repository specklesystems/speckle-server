import { knex, ServerInvites, Streams } from '@/modules/core/dbSchema'
import {
  getUserByEmail,
  getUser,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { resolveTarget, buildUserTarget } from '@/modules/serverinvites/helpers/core'
import { uniq } from 'lodash'
import {
  InviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import { Knex } from 'knex'
import {
  CountServerInvites,
  DeleteAllStreamInvites,
  DeleteAllUserInvites,
  DeleteInvite,
  DeleteInvitesByTarget,
  DeleteServerOnlyInvites,
  DeleteStreamInvite,
  FindInvite,
  FindInviteByToken,
  FindServerInvite,
  FindServerInvites,
  InsertInviteAndDeleteOld,
  QueryAllStreamInvites,
  QueryAllUserStreamInvites,
  QueryInvites,
  QueryServerInvites,
  UpdateAllInviteTargets
} from '@/modules/serverinvites/domain/operations'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { isNonNullable, SetValuesNullable } from '@speckle/shared'

export type ServerInviteResourceFilter = Partial<
  SetValuesNullable<Pick<InviteResourceTarget, 'resourceId' | 'resourceType'>>
>

/**
 * TODO:
 * - Adjust services to use new resources col
 * - Refactor/drop old repo calls to support new flows
 * - Fix tests
 */

type InvitesRetrievalValidityFilter = (q: Knex.QueryBuilder) => Knex.QueryBuilder

const projectInviteValidityFilter: InvitesRetrievalValidityFilter = (q) =>
  q
    .join(
      knex.raw(
        "LEFT JOIN :streams: ON :resourceCol: ->> 'resourceType' = :resourceType AND :resourceCol: ->> 'resourceId' = :streamIdCol:",
        {
          streams: Streams.name,
          resourceCol: ServerInvites.col.resource,
          resourceType: ProjectInviteResourceType,
          streamIdCol: Streams.col.id
        }
      )
    )
    .where((w1) => {
      w1.whereNot((w2) =>
        filterByResource(w2, { resourceType: ProjectInviteResourceType })
      ).orWhereNotNull(Streams.col.id)
    })

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const buildInvitesBaseQuery =
  ({ db }: { db: Knex }) =>
  (
    options?: Partial<{
      /**
       * Sort order. Defaults to 'asc'.
       */
      sort: 'asc' | 'desc'
      /**
       * Optionally add extra filters to query
       */
      filterQuery?: InvitesRetrievalValidityFilter
    }>
  ) => {
    const { sort = 'asc', filterQuery } = options || {}

    const q = db(ServerInvites.name)
      .where((w1) => projectInviteValidityFilter(w1)) // single built in filter
      .select<ServerInviteRecord[]>(ServerInvites.cols)
      .orderBy(ServerInvites.col.createdAt, sort)

    if (filterQuery) {
      q.where(filterQuery)
    }

    return q
  }

const filterByResource = <Q extends Knex.QueryBuilder>(
  query: Q,
  filter: ServerInviteResourceFilter
) => {
  if (filter.resourceId) {
    query.whereRaw(`?? ->> 'resourceId' = ?`, [
      ServerInvites.col.resource,
      filter.resourceId
    ])
  }

  if (filter.resourceType) {
    query.whereRaw(`?? ->> 'resourceType' = ?`, [
      ServerInvites.col.resource,
      filter.resourceType
    ])
  }
}

/**
 * Try to find a user using the target value
 */
export const findUserByTargetFactory =
  () =>
  (target: string): Promise<UserWithOptionalRole | null> => {
    const { userEmail, userId } = resolveTarget(target)
    return userEmail
      ? getUserByEmail(userEmail, { withRole: true })
      : getUser(userId!, { withRole: true })
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
      .where((q) => filterByResource(q, invite.resource))
      .whereIn(ServerInvites.col.target, allTargets)
      .delete()

    await deleteQ

    // Insert new
    invite.target = invite.target.toLowerCase() // Extra safety cause our schema is case sensitive
    return db<ServerInviteRecord>(ServerInvites.name).insert(invite)
  }

/**
 * Get all invitations to streams that the specified user has
 */
export const queryAllUserStreamInvitesFactory =
  ({ db }: { db: Knex }): QueryAllUserStreamInvites =>
  async (userId) => {
    if (!userId) return []
    const target = buildUserTarget(userId)

    const q = buildInvitesBaseQuery({ db })()
      .where({
        [ServerInvites.col.target]: target
      })
      .where((q) =>
        filterByResource(q, {
          resourceType: ProjectInviteResourceType
        })
      )
    const res = await q

    return res
  }

export const findServerInviteFactory =
  ({ db }: { db: Knex }): FindServerInvite =>
  async (email, token) => {
    if (!email && !token) return null

    const q = buildInvitesBaseQuery({ db })()

    if (email) {
      q.andWhere({
        [ServerInvites.col.target]: email.toLowerCase()
      })
    }

    if (token) {
      q.andWhere(ServerInvites.col.token, token)
    }

    return (await q.first()) || null
  }

export const queryAllStreamInvitesFactory =
  ({ db }: { db: Knex }): QueryAllStreamInvites =>
  async (streamId) => {
    if (!streamId) return []

    return await buildInvitesBaseQuery({ db })().where((q) =>
      filterByResource(q, {
        resourceType: ProjectInviteResourceType,
        resourceId: streamId
      })
    )
  }

export const deleteAllStreamInvitesFactory =
  ({ db }: { db: Knex }): DeleteAllStreamInvites =>
  async (streamId) => {
    if (!streamId) return false
    await db(ServerInvites.name)
      .where((q) =>
        filterByResource(q, {
          resourceType: ProjectInviteResourceType,
          resourceId: streamId
        })
      )
      .delete()
    return true
  }

export const deleteServerOnlyInvitesFactory =
  ({ db }: { db: Knex }): DeleteServerOnlyInvites =>
  async (email) => {
    if (!email) return

    return db<ServerInviteRecord>(ServerInvites.name)
      .where((q) => {
        q.where((q1) =>
          filterByResource(q1, { resourceType: ServerInviteResourceType })
        ).orWhere((q2) => filterByResource(q2, { resourceType: null }))
      })
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

export const deleteStreamInviteFactory =
  ({ db }: { db: Knex }): DeleteStreamInvite =>
  async (inviteId) => {
    if (!inviteId) return

    return db(ServerInvites.name)
      .where({
        [ServerInvites.col.id]: inviteId
      })
      .andWhere((q) => filterByResource(q, { resourceType: ProjectInviteResourceType }))
      .delete()
  }

const findServerInvitesBaseQueryFactory =
  ({ db }: { db: Knex }) =>
  (searchQuery: string | null, sort: 'asc' | 'desc' = 'asc'): Knex.QueryBuilder => {
    const q = buildInvitesBaseQuery({ db })({ sort })

    if (searchQuery) {
      // TODO: Is this safe from SQL injection?
      q.andWhere(ServerInvites.col.target, 'ILIKE', `%${searchQuery}%`)
    }

    // Not an invite for an already registered user
    q.andWhere(ServerInvites.col.target, 'NOT ILIKE', '@%')
    return q
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
    return q
  }

export const findInviteFactory =
  ({ db }: { db: Knex }): FindInvite =>
  async (params) => {
    if (!Object.values(params).filter(isNonNullable).length) return null
    const { inviteId, target, token, resourceFilter } = params

    const q = buildInvitesBaseQuery({ db })().first()

    if (inviteId) {
      q.where(ServerInvites.col.id, inviteId)
    }

    if (target) {
      q.where(ServerInvites.col.target, target)
    }

    if (token) {
      q.where(ServerInvites.col.token, token)
    }

    if (resourceFilter) {
      q.where((w1) => filterByResource(w1, resourceFilter))
    }

    return (await q) || null
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
      .where((q) => filterByResource(q, { resourceType, resourceId }))
      .whereIn(ServerInvites.col.target, targets)
      .delete()

    return true
  }

export const queryInvitesFactory =
  ({ db }: { db: Knex }): QueryInvites =>
  async (inviteIds) => {
    if (!inviteIds?.length) return []
    return buildInvitesBaseQuery({ db })().whereIn(ServerInvites.col.id, inviteIds)
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
    const q = buildInvitesBaseQuery({ db })()
      .where(ServerInvites.col.token, token)
      .first()

    return (await q) || null
  }
