import { knex, ServerInvites, Streams, Users } from '@/modules/core/dbSchema'
import {
  getUserByEmailFactory,
  getUserFactory,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { resolveTarget, buildUserTarget } from '@/modules/serverinvites/helpers/core'
import { isObjectLike, uniq } from 'lodash'
import {
  InviteResourceTarget,
  InviteResourceTargetType,
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
import { isNonNullable, SetValuesNullable } from '@speckle/shared'
import { LogicError } from '@/modules/shared/errors'

export type ServerInviteResourceFilter<
  TargetType extends InviteResourceTargetType = InviteResourceTargetType,
  RoleType extends string = string
> = Partial<
  SetValuesNullable<
    Pick<InviteResourceTarget<TargetType, RoleType>, 'resourceId' | 'resourceType'>
  >
>

export type InvitesRetrievalValidityFilter = (q: Knex.QueryBuilder) => Knex.QueryBuilder

const projectInviteValidityFilter: InvitesRetrievalValidityFilter = (q) => {
  let finalQ = q.leftJoin(
    knex.raw(
      ":streams: ON :resourceCol: ->> 'resourceType' = :resourceType AND :resourceCol: ->> 'resourceId' = :streamIdCol:",
      {
        streams: Streams.name,
        resourceCol: ServerInvites.col.resource,
        resourceType: ProjectInviteResourceType,
        streamIdCol: Streams.col.id
      }
    )
  )

  finalQ = finalQ.where((w1) => {
    w1.whereNot((w2) =>
      filterByResource(w2, { resourceType: ProjectInviteResourceType })
    ).orWhereNotNull(Streams.col.id)
  })

  return finalQ
}

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const buildInvitesBaseQuery =
  ({ db }: { db: Knex }) =>
  <Result = ServerInviteRecord[]>(
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
      .select<Result>(ServerInvites.cols)
      .orderBy(ServerInvites.col.updatedAt, sort)

    // single built in filter
    projectInviteValidityFilter(q)

    if (filterQuery) {
      filterQuery(q)
    }

    return q
  }

export const filterByResource = <Q extends Knex.QueryBuilder>(
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
      .where((q) => filterByResource(q, invite.resource))
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
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): QueryAllUserResourceInvites =>
  async <
    TargetType extends InviteResourceTargetType = InviteResourceTargetType,
    RoleType extends string = string
  >(params: {
    userId: string
    resourceType: TargetType
  }) => {
    const { userId, resourceType } = params
    if (!userId) return []

    const target = buildUserTarget(userId)

    const q = buildInvitesBaseQuery({ db })<
      ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>>[]
    >({ filterQuery })
      .where({
        [ServerInvites.col.target]: target
      })
      .where((q) =>
        filterByResource(q, {
          resourceType
        })
      )
    const res = await q

    return res
  }

export const findServerInviteFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): FindServerInvite =>
  async (email, token) => {
    if (!email && !token) return null

    const q = buildInvitesBaseQuery({ db })({ filterQuery })

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

export const queryAllResourceInvitesFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): QueryAllResourceInvites =>
  async <
    TargetType extends InviteResourceTargetType = InviteResourceTargetType,
    RoleType extends string = string
  >(
    filter: Pick<
      InviteResourceTarget<TargetType, RoleType>,
      'resourceId' | 'resourceType'
    > & { search?: string }
  ) => {
    if (!filter.resourceId) return []

    const q = buildInvitesBaseQuery({ db })<
      ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>>[]
    >({ filterQuery })

    q.where((q) => filterByResource(q, filter))

    if (filter.search) {
      q.leftJoin(
        Users.name,
        Users.col.id,
        knex.raw('SUBSTRING(?? FROM 2)', [ServerInvites.col.target])
      ).where((w1) => {
        w1.where(ServerInvites.col.target, 'ILIKE', `%${filter.search}%`).orWhere(
          Users.col.name,
          'ILIKE',
          `%${filter.search}%`
        )
      })
    }

    return await q
  }

export const deleteAllResourceInvitesFactory =
  ({ db }: { db: Knex }): DeleteAllResourceInvites =>
  async <
    TargetType extends InviteResourceTargetType = InviteResourceTargetType,
    RoleType extends string = string
  >(
    filter: Pick<
      InviteResourceTarget<TargetType, RoleType>,
      'resourceId' | 'resourceType'
    >
  ) => {
    if (!filter.resourceId) return false

    await db(ServerInvites.name)
      .where((q) => filterByResource(q, filter))
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

const findServerInvitesBaseQueryFactory =
  ({ db, filterQuery }: { db: Knex; filterQuery?: InvitesRetrievalValidityFilter }) =>
  (searchQuery: string | null, sort: 'asc' | 'desc' = 'asc'): Knex.QueryBuilder => {
    const q = buildInvitesBaseQuery({ db })({ sort, filterQuery })

    if (searchQuery) {
      // TODO: Is this safe from SQL injection?
      q.andWhere(ServerInvites.col.target, 'ILIKE', `%${searchQuery}%`)
    }

    // Not an invite for an already registered user
    q.andWhere(ServerInvites.col.target, 'NOT ILIKE', '@%')
    return q
  }

export const countServerInvitesFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): CountServerInvites =>
  async (searchQuery) => {
    const q = findServerInvitesBaseQueryFactory({ db, filterQuery })(searchQuery)
    const [count] = await db()
      .count()
      .from((q as Knex.QueryBuilder).as('sq1'))
    return parseInt(count.count.toString())
  }

export const findServerInvitesFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): FindServerInvites =>
  async (searchQuery, limit, offset) => {
    const q = findServerInvitesBaseQueryFactory({ db, filterQuery })(
      searchQuery
    ) as Knex.QueryBuilder
    return q.limit(limit).offset(offset) as Promise<ServerInviteRecord[]>
  }

export const queryServerInvitesFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): QueryServerInvites =>
  async (searchQuery, limit, cursor) => {
    const q = findServerInvitesBaseQueryFactory({ db, filterQuery })(
      searchQuery,
      'desc'
    )
    q.limit(limit)

    if (cursor) q.where(ServerInvites.col.createdAt, '<', cursor.toISOString())
    return q
  }

export const findInviteFactory =
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): FindInvite =>
  async <
    TargetType extends InviteResourceTargetType = InviteResourceTargetType,
    RoleType extends string = string
  >(params: {
    inviteId?: string
    token?: string
    target?: string
    resourceFilter?: ServerInviteResourceFilter<TargetType, RoleType>
  }) => {
    if (!isObjectLike(params)) {
      throw new LogicError('Invalid params - expected a params object')
    }
    if (!Object.values(params).filter(isNonNullable).length) return null
    const { inviteId, target, token, resourceFilter } = params

    const q = buildInvitesBaseQuery({ db })<
      ServerInviteRecord<InviteResourceTarget<TargetType, RoleType>>[]
    >({ filterQuery }).first()

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
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): QueryInvites =>
  async (inviteIds) => {
    if (!inviteIds?.length) return []
    return buildInvitesBaseQuery({ db })({ filterQuery }).whereIn(
      ServerInvites.col.id,
      inviteIds
    )
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
  ({
    db,
    filterQuery
  }: {
    db: Knex
    filterQuery?: InvitesRetrievalValidityFilter
  }): FindInviteByToken =>
  async ({ token }) => {
    if (!token?.length) return null
    const q = buildInvitesBaseQuery({ db })({ filterQuery })
      .where(ServerInvites.col.token, token)
      .first()

    return (await q) || null
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
