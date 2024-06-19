import { ServerInvites, Streams } from '@/modules/core/dbSchema'
import {
  getUserByEmail,
  getUser,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { ResourceNotResolvableError } from '@/modules/serverinvites/errors'
import {
  resolveTarget,
  ResourceTargets,
  buildUserTarget,
  isServerInvite
} from '@/modules/serverinvites/helpers/inviteHelper'
import { uniq } from 'lodash'
import { StreamWithOptionalRole, getStream } from '@/modules/core/repositories/streams'
import {
  ServerInviteRecord,
  StreamInviteRecord
} from '@/modules/serverinvites/domain/types'
import { Knex } from 'knex'

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
const findResource =
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
const findUserByTarget =
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
const insertInviteAndDeleteOld =
  ({ db }: { db: Knex }) =>
  async (
    invite: Pick<
      ServerInviteRecord,
      | 'id'
      | 'target'
      | 'inviterId'
      | 'message'
      | 'resourceTarget'
      | 'resourceId'
      | 'role'
      | 'token'
      | 'serverRole'
    >,
    alternateTargets: string[] = []
  ): Promise<number[]> => {
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
const queryAllUserStreamInvites =
  ({ db }: { db: Knex }) =>
  async (userId: string): Promise<StreamInviteRecord[]> => {
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
const findStreamInvite =
  ({ db }: { db: Knex }) =>
  async (
    streamId: string,
    {
      target = null,
      token = null,
      inviteId = null
    }: { target?: string | null; token?: string | null; inviteId?: string | null } = {}
  ): Promise<StreamInviteRecord | null> => {
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

const findServerInvite =
  ({ db }: { db: Knex }) =>
  async (email?: string, token?: string): Promise<ServerInviteRecord | null> => {
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

const queryAllStreamInvites =
  ({ db }: { db: Knex }) =>
  async (streamId: string): Promise<StreamInviteRecord[]> => {
    if (!streamId) return []

    return buildInvitesBaseQuery({ db })().where({
      [ServerInvites.col.resourceTarget]: ResourceTargets.Streams,
      [ServerInvites.col.resourceId]: streamId
    })
  }

const deleteAllStreamInvites =
  ({ db }: { db: Knex }) =>
  async (streamId: string): Promise<boolean> => {
    if (!streamId) return false
    await db(ServerInvites.name)
      .where(ServerInvites.col.resourceId, streamId)
      .andWhere(ServerInvites.col.resourceTarget, ResourceTargets.Streams)
      .delete()
    return true
  }

const deleteServerOnlyInvites =
  ({ db }: { db: Knex }) =>
  async (email?: string) => {
    if (!email) return

    return db<ServerInviteRecord>(ServerInvites.name)
      .where({
        [ServerInvites.col.target]: email.toLowerCase(),
        [ServerInvites.col.resourceTarget]: null
      })
      .delete()
  }

const updateAllInviteTargets =
  ({ db }: { db: Knex }) =>
  async (oldTargets?: string | string[], newTarget?: string) => {
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

const deleteStreamInvite =
  ({ db }: { db: Knex }) =>
  async (inviteId?: string) => {
    if (!inviteId) return

    return db(ServerInvites.name)
      .where({
        [ServerInvites.col.id]: inviteId,
        [ServerInvites.col.resourceTarget]: ResourceTargets.Streams
      })
      .delete()
  }

const findServerInvitesBaseQuery =
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

const countServerInvites =
  ({ db }: { db: Knex }) =>
  async (searchQuery: string | null) => {
    const q = findServerInvitesBaseQuery({ db })(searchQuery)
    const [count] = await db()
      .count()
      .from((q as Knex.QueryBuilder).as('sq1'))
    return parseInt(count.count.toString())
  }

const findServerInvites =
  ({ db }: { db: Knex }) =>
  async (
    searchQuery: string | null,
    limit: number,
    offset: number
  ): Promise<ServerInviteRecord[]> => {
    const q = findServerInvitesBaseQuery({ db })(searchQuery) as Knex.QueryBuilder
    return q.limit(limit).offset(offset) as Promise<ServerInviteRecord[]>
  }

const queryServerInvites =
  ({ db }: { db: Knex }) =>
  async (searchQuery: string | null, limit: number, cursor: Date | null) => {
    const q = findServerInvitesBaseQuery({ db })(searchQuery, 'desc')
    q.limit(limit)

    if (cursor) q.where(ServerInvites.col.createdAt, '<', cursor.toISOString())
    return q
  }

const findInvite =
  ({ db }: { db: Knex }) =>
  async (inviteId?: string): Promise<ServerInviteRecord | null> => {
    if (!inviteId) return null
    return buildInvitesBaseQuery({ db })().where(ServerInvites.col.id, inviteId).first()
  }

const deleteInvite =
  ({ db }: { db: Knex }) =>
  async (inviteId?: string): Promise<boolean> => {
    if (!inviteId) return false
    await db(ServerInvites.name).where(ServerInvites.col.id, inviteId).delete()
    return true
  }

/**
 * Delete invites by target - useful when there are potentially duplicate invites that need cleaning up
 * (e.g. same target, but multiple inviters)
 */
const deleteInvitesByTarget =
  ({ db }: { db: Knex }) =>
  async (
    targets?: string | string[],
    resourceTarget?: string,
    resourceId?: string
  ): Promise<boolean> => {
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
const queryInvites =
  ({ db }: { db: Knex }) =>
  async (inviteIds?: readonly string[]): Promise<ServerInviteRecord[]> => {
    if (!inviteIds?.length) return []
    return buildInvitesBaseQuery({ db })().whereIn(ServerInvites.col.id, inviteIds)
  }

const deleteAllUserInvites =
  ({ db }: { db: Knex }) =>
  async (userId?: string): Promise<boolean> => {
    if (!userId) return false
    await db(ServerInvites.name)
      .where(ServerInvites.col.target, buildUserTarget(userId))
      .delete()
    return true
  }

const findInviteByToken =
  ({ db }: { db: Knex }) =>
  async (inviteToken?: string): Promise<ServerInviteRecord | null> => {
    if (!inviteToken) return null
    return buildInvitesBaseQuery({ db })()
      .where(ServerInvites.col.token, inviteToken)
      .first()
  }

export const createServerInvitesRepository = ({ db }: { db: Knex }) => ({
  queryAllUserStreamInvites: queryAllUserStreamInvites({ db }),
  findStreamInvite: findStreamInvite({ db }),
  findUserByTarget: findUserByTarget(),
  findResource: findResource(),
  insertInviteAndDeleteOld: insertInviteAndDeleteOld({ db }),
  findServerInvite: findServerInvite({ db }),
  queryAllStreamInvites: queryAllStreamInvites({ db }),
  deleteAllStreamInvites: deleteAllStreamInvites({ db }),
  deleteServerOnlyInvites: deleteServerOnlyInvites({ db }),
  updateAllInviteTargets: updateAllInviteTargets({ db }),
  deleteStreamInvite: deleteStreamInvite({ db }),
  countServerInvites: countServerInvites({ db }),
  findServerInvites: findServerInvites({ db }),
  queryServerInvites: queryServerInvites({ db }),
  findInvite: findInvite({ db }),
  deleteInvite: deleteInvite({ db }),
  deleteInvitesByTarget: deleteInvitesByTarget({ db }),
  queryInvites: queryInvites({ db }),
  deleteAllUserInvites: deleteAllUserInvites({ db }),
  findInviteByToken: findInviteByToken({ db })
})
