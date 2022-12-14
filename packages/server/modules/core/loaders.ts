import DataLoader from 'dataloader'
import {
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  getOwnedFavoritesCountByUserIds,
  getStreams,
  getStreamRoles,
  getStreamsSourceApps
} from '@/modules/core/repositories/streams'
import { getUsers } from '@/modules/core/repositories/users'
import { keyBy } from 'lodash'
import { getInvites } from '@/modules/serverinvites/repositories'
import { AuthContext } from '@/modules/shared/authz'
import {
  CommitRecord,
  LimitedUserRecord,
  StreamFavoriteRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/helpers/types'
import {
  getCommitStreams,
  getStreamCommitCounts
} from '@/modules/core/repositories/commits'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import {
  getBranchCommentCounts,
  getCommentsResources,
  getStreamCommentCounts
} from '@/modules/comments/repositories/comments'
import {
  getBranchCommitCounts,
  getBranchLatestCommits,
  getStreamBranchCounts
} from '@/modules/core/repositories/branches'

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
        return streamIds.map((id) => results[id] || null)
      }),
      getBranchCount: new DataLoader<string, number>(async (streamIds) => {
        const results = keyBy(
          await getStreamBranchCounts(streamIds.slice()),
          'streamId'
        )
        return streamIds.map((i) => results[i]?.count || 0)
      }),
      getCommitCountWithoutGlobals: new DataLoader<string, number>(
        async (streamIds) => {
          const results = keyBy(
            await getStreamCommitCounts(streamIds.slice(), {
              ignoreGlobalsBranch: true
            }),
            'streamId'
          )
          return streamIds.map((i) => results[i]?.count || 0)
        }
      ),
      getCommentThreadCount: new DataLoader<string, number>(async (streamIds) => {
        const results = keyBy(
          await getStreamCommentCounts(streamIds.slice(), { threadsOnly: true }),
          'streamId'
        )
        return streamIds.map((i) => results[i]?.count || 0)
      }),
      getSourceApps: new DataLoader<string, string[]>(async (streamIds) => {
        const results = await getStreamsSourceApps(streamIds.slice())
        return streamIds.map((i) => results[i] || [])
      })
    },
    branches: {
      getCommitCount: new DataLoader<string, number>(async (branchIds) => {
        const results = keyBy(await getBranchCommitCounts(branchIds.slice()), 'id')
        return branchIds.map((i) => results[i]?.count || 0)
      }),
      getLatestCommit: new DataLoader<string, Nullable<CommitRecord>>(
        async (branchIds) => {
          const results = keyBy(
            await getBranchLatestCommits(branchIds.slice()),
            'branchId'
          )
          return branchIds.map((i) => results[i] || null)
        }
      ),
      getCommentThreadCount: new DataLoader<string, number>(async (branchIds) => {
        const results = keyBy(
          await getBranchCommentCounts(branchIds.slice(), { threadsOnly: true }),
          'id'
        )
        return branchIds.map((i) => results[i]?.count || 0)
      })
    },
    commits: {
      /**
       * Get a commit's stream from DB
       */
      getCommitStream: new DataLoader<string, Nullable<StreamRecord>>(
        async (commitIds) => {
          const results = await getCommitStreams(commitIds.slice())
          return commitIds.map((id) => results[id] || null)
        }
      )
    },
    comments: {
      getResources: new DataLoader<string, ResourceIdentifier[]>(async (commentIds) => {
        const results = await getCommentsResources(commentIds.slice())
        return commentIds.map((id) => results[id]?.resources || [])
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
