import { ServerInvites, Streams } from '@/modules/core/dbSchema'
import {
  getUserByEmail,
  getUser,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { ResourceNotResolvableError } from '@/modules/serverinvites/errors'
import { resolveTarget, buildUserTarget } from '@/modules/serverinvites/helpers/core'
import {
  ResourceTargets,
  isServerInvite
} from '@/modules/serverinvites/helpers/legacyCore'
import { uniq } from 'lodash'
import { StreamWithOptionalRole, getStream } from '@/modules/core/repositories/streams'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
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
  FindStreamInvite,
  InsertInviteAndDeleteOld,
  QueryAllStreamInvites,
  QueryAllUserStreamInvites,
  QueryInvites,
  QueryServerInvites,
  UpdateAllInviteTargets
} from '@/modules/serverinvites/domain/operations'

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const buildInvitesBaseQuery =
  ({ db }: { db: Knex }) =>
  (sort: 'asc' | 'desc' = 'asc') => {
    // join just to ensure we don't retrieve invalid invites
    const q = db<ServerInviteRecord>(ServerInvites.name)
      .select(ServerInvites.cols)
      .leftJoin(Streams.name, (j) => {
        j.onNotNull(ServerInvites.col.resourceId)
          .andOnVal(ServerInvites.col.resourceTarget, ResourceTargets.Streams)
          .andOn(Streams.col.id, ServerInvites.col.resourceId)
      })
      .where((w1) => {
        w1.whereNull(ServerInvites.col.resourceId).orWhereNotNull(Streams.col.id)
      })
      .orderBy(ServerInvites.col.createdAt, sort)
    return q
  }

/**
 * Resolve resource from invite
 */
export const findResourceFactory =
  () =>
  async (invite: {
    resourceId?: string | null
    resourceTarget?: typeof ResourceTargets.Streams | null
  }): Promise<StreamWithOptionalRole | undefined | null> => {
    if (isServerInvite(invite)) return null

    const { resourceId, resourceTarget } = invite
    if (resourceTarget === ResourceTargets.Streams) {
      return getStream({ streamId: resourceId ?? undefined })
    } else {
      throw new ResourceNotResolvableError('Unexpected invite resource type')
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
    await db<ServerInviteRecord>(ServerInvites.name)
      .where({
        [ServerInvites.col.resourceId]: invite.resourceId || null,
        [ServerInvites.col.resourceTarget]: invite.resourceTarget || null
      })
      .whereIn(ServerInvites.col.target, allTargets)
      .delete()

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

    return buildInvitesBaseQuery({ db })().where({
      [ServerInvites.col.target]: target,
      [ServerInvites.col.resourceTarget]: ResourceTargets.Streams
    })
  }

/**
 * Retrieve a stream invite for the specified target, token or both.
 * Note: Either the target, inviteId or token must be set
 */
export const findStreamInviteFactory =
  ({ db }: { db: Knex }): FindStreamInvite =>
  async (streamId, { target = null, token = null, inviteId = null } = {}) => {
    if (!target && !token && !inviteId) return null

    const q = buildInvitesBaseQuery({ db })().where({
      [ServerInvites.col.resourceTarget]: ResourceTargets.Streams,
      [ServerInvites.col.resourceId]: streamId
    })

    if (target) {
      q.andWhere({
        [ServerInvites.col.target]: target.toLowerCase()
      })
    } else if (inviteId) {
      q.andWhere({
        [ServerInvites.col.id]: inviteId
      })
    } else if (token) {
      q.andWhere({
        [ServerInvites.col.token]: token
      })
    }

    return q.first()
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

    return q.first()
  }

export const queryAllStreamInvitesFactory =
  ({ db }: { db: Knex }): QueryAllStreamInvites =>
  async (streamId) => {
    if (!streamId) return []

    return buildInvitesBaseQuery({ db })().where({
      [ServerInvites.col.resourceTarget]: ResourceTargets.Streams,
      [ServerInvites.col.resourceId]: streamId
    })
  }

export const deleteAllStreamInvitesFactory =
  ({ db }: { db: Knex }): DeleteAllStreamInvites =>
  async (streamId) => {
    if (!streamId) return false
    await db(ServerInvites.name)
      .where(ServerInvites.col.resourceId, streamId)
      .andWhere(ServerInvites.col.resourceTarget, ResourceTargets.Streams)
      .delete()
    return true
  }

export const deleteServerOnlyInvitesFactory =
  ({ db }: { db: Knex }): DeleteServerOnlyInvites =>
  async (email) => {
    if (!email) return

    return db<ServerInviteRecord>(ServerInvites.name)
      .where({
        [ServerInvites.col.target]: email.toLowerCase(),
        [ServerInvites.col.resourceTarget]: null
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

    // PostgreSQL doesn't support aliases in update calls for some reason...
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
        [ServerInvites.col.id]: inviteId,
        [ServerInvites.col.resourceTarget]: ResourceTargets.Streams
      })
      .delete()
  }

const findServerInvitesBaseQueryFactory =
  ({ db }: { db: Knex }) =>
  (searchQuery: string | null, sort: 'asc' | 'desc' = 'asc'): Knex.QueryBuilder => {
    const q = buildInvitesBaseQuery({ db })(sort)

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
  async (inviteId) => {
    if (!inviteId) return null
    return buildInvitesBaseQuery({ db })().where(ServerInvites.col.id, inviteId).first()
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
  async (targets, resourceTarget, resourceId) => {
    if (!targets) return false
    targets = Array.isArray(targets) ? targets : [targets]
    if (!targets.length) return false

    await db(ServerInvites.name)
      .where({
        [ServerInvites.col.resourceTarget]: resourceTarget,
        [ServerInvites.col.resourceId]: resourceId
      })
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
  async (inviteToken) => {
    if (!inviteToken) return null
    return buildInvitesBaseQuery({ db })()
      .where(ServerInvites.col.token, inviteToken)
      .first()
  }
