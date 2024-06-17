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
import { ServerInviteRecord, StreamInviteRecord } from '../helpers/types'
import { Knex } from 'knex'

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const buildInvitesBaseQuery =
  ({ db }: { db: Knex }) =>
  (sort = 'asc') => {
    // join just to ensure we don't retrieve invalid invites
    return db<ServerInviteRecord>(ServerInvites.name)
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

export const createServerInvitesRepository = ({ db }: { db: Knex }) => ({
  queryAllUserStreamInvites: queryAllUserStreamInvites({ db }),
  findStreamInvite: findStreamInvite({ db }),
  findUserByTarget: findUserByTarget(),
  findResource: findResource(),
  insertInviteAndDeleteOld: insertInviteAndDeleteOld({ db }),
  findServerInvite: findServerInvite({ db }),
  queryAllStreamInvites: queryAllStreamInvites({ db }),
  deleteAllStreamInvites: deleteAllStreamInvites({ db }),
  deleteServerOnlyInvites: deleteServerOnlyInvites({ db })
})
