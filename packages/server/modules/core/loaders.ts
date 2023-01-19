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
  BranchRecord,
  CommitRecord,
  LimitedUserRecord,
  StreamFavoriteRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/helpers/types'
import {
  getCommitBranches,
  getCommitStreams,
  getStreamCommitCounts
} from '@/modules/core/repositories/commits'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import {
  getBranchCommentCounts,
  getCommentReplyAuthorIds,
  getCommentReplyCounts,
  getCommentsResources,
  getCommentsViewedAt,
  getStreamCommentCounts
} from '@/modules/comments/repositories/comments'
import {
  getBranchCommitCounts,
  getBranchesByIds,
  getBranchLatestCommits,
  getStreamBranchCounts,
  getStreamBranchesByName
} from '@/modules/core/repositories/branches'

/**
 * TODO: Lazy load DataLoaders to reduce memory usage
 * - Instead of keeping them request scoped, cache them in redis identified by request (user ID) with a TTL,
 * so that users with the same ID can re-use them across requests/subscriptions
 */

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
      }),
      /**
       * Get a specific branch of a specific stream. Each stream ID technically has its own loader &
       * thus its own query.
       */
      getStreamBranchByName: (() => {
        type BranchDataLoader = DataLoader<string, Nullable<BranchRecord>>
        const streamBranchLoaders = new Map<string, BranchDataLoader>()
        return {
          forStream(streamId: string): BranchDataLoader {
            let loader = streamBranchLoaders.get(streamId)
            if (!loader) {
              loader = new DataLoader<string, Nullable<BranchRecord>>(
                async (branchNames) => {
                  const results = keyBy(
                    await getStreamBranchesByName(streamId, branchNames.slice()),
                    'name'
                  )
                  return branchNames.map((n) => results[n] || null)
                }
              )
              streamBranchLoaders.set(streamId, loader)
            }

            return loader
          }
        }
      })()
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
      }),
      getById: new DataLoader<string, Nullable<BranchRecord>>(async (branchIds) => {
        const results = keyBy(await getBranchesByIds(branchIds.slice()), 'id')
        return branchIds.map((i) => results[i] || null)
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
      ),

      getCommitBranch: new DataLoader<string, Nullable<BranchRecord>>(
        async (commitIds) => {
          const results = keyBy(await getCommitBranches(commitIds.slice()), 'commitId')
          return commitIds.map((id) => results[id] || null)
        }
      )
    },
    comments: {
      getViewedAt: new DataLoader<string, Date>(async (commentIds) => {
        if (!userId) return []

        const results = keyBy(
          await getCommentsViewedAt(commentIds.slice(), userId),
          'commentId'
        )
        return commentIds.map((id) => results[id]?.viewedAt || null)
      }),
      getResources: new DataLoader<string, ResourceIdentifier[]>(async (commentIds) => {
        const results = await getCommentsResources(commentIds.slice())
        return commentIds.map((id) => results[id]?.resources || [])
      }),
      getReplyCount: new DataLoader<string, number>(async (threadIds) => {
        const results = keyBy(
          await getCommentReplyCounts(threadIds.slice()),
          'threadId'
        )
        return threadIds.map((id) => results[id]?.count || 0)
      }),
      getReplyAuthorIds: new DataLoader<string, string[]>(async (threadIds) => {
        const results = await getCommentReplyAuthorIds(threadIds.slice())
        return threadIds.map((id) => results[id] || [])
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
