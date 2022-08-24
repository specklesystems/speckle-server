import DataLoader from 'dataloader'
import {
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  getOwnedFavoritesCountByUserIds,
  getStreams,
  getStreamRoles
} from '@/modules/core/repositories/streams'
import { getUsers } from '@/modules/core/repositories/users'
import { keyBy } from 'lodash'
import { getInvites } from '@/modules/serverinvites/repositories'
import { AuthContext } from '@/modules/shared/authz'
import {
  LimitedUserRecord,
  StreamFavoriteRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/helpers/types'

/**
 * Build request-scoped dataloaders
 * @param ctx GraphQL context w/o loaders
 */
export function buildRequestLoaders(ctx: AuthContext) {
  const userId = ctx.userId

  return {
    streams: {
      /**
       * Get favorite metadata for a specific stream and user
       */
      getUserFavoriteData: new DataLoader<string, Nullable<StreamFavoriteRecord>>(
        async (streamIds) => {
          if (!userId) {
            return streamIds.map(() => null)
          }

          const results = await getBatchUserFavoriteData({
            userId,
            streamIds: streamIds.slice()
          })
          return streamIds.map((k) => results[k])
        }
      ),

      /**
       * Get amount of favorites for a specific stream
       */
      getFavoritesCount: new DataLoader<string, number>(async (streamIds) => {
        const results = await getBatchStreamFavoritesCounts(streamIds.slice())
        return streamIds.map((k) => results[k] || 0)
      }),

      /**
       * Get total amount of favorites of owned streams
       */
      getOwnedFavoritesCount: new DataLoader<string, number>(async (userIds) => {
        const results = await getOwnedFavoritesCountByUserIds(userIds.slice())
        return userIds.map((i) => results[i] || 0)
      }),

      /**
       * Get stream from DB
       *
       * Note: Considering the difficulty of writing a single query that queries for multiple stream IDs
       * and multiple user IDs also, currently this dataloader will only use a single userId
       */
      getStream: new DataLoader<string, Nullable<StreamRecord>>(async (streamIds) => {
        const results = keyBy(await getStreams(streamIds.slice()), 'id')
        return streamIds.map((i) => results[i] || null)
      }),

      /**
       * Get stream role from DB
       */
      getRole: new DataLoader<string, Nullable<string>>(async (streamIds) => {
        if (!userId) return streamIds.map(() => null)

        const results = await getStreamRoles(userId, streamIds.slice())
        return streamIds.map((id) => results[id])
      })
    },
    users: {
      /**
       * Get user from DB
       */
      getUser: new DataLoader<string, Nullable<LimitedUserRecord>>(async (userIds) => {
        const results = keyBy(await getUsers(userIds.slice()), 'id')
        return userIds.map((i) => results[i] || null)
      })
    },
    invites: {
      /**
       * Get invite from DB
       */
      getInvite: new DataLoader<string, Nullable<ServerInviteRecord>>(
        async (inviteIds) => {
          const results = keyBy(await getInvites(inviteIds), 'id')
          return inviteIds.map((i) => results[i] || null)
        }
      )
    }
  }
}

export type RequestDataLoaders = ReturnType<typeof buildRequestLoaders>
