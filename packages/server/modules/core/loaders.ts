/* eslint-disable @typescript-eslint/no-explicit-any */
import DataLoader from 'dataloader'
import {
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  getOwnedFavoritesCountByUserIds,
  getStreams,
  getStreamRoles,
  getStreamsSourceApps,
  getCommitStreams,
  StreamWithCommitId
} from '@/modules/core/repositories/streams'
import { UserWithOptionalRole, getUsers } from '@/modules/core/repositories/users'
import { keyBy } from 'lodash'
import { getInvites } from '@/modules/serverinvites/repositories'
import { AuthContext } from '@/modules/shared/authz'
import {
  BranchRecord,
  CommitRecord,
  LimitedUserRecord,
  StreamFavoriteRecord,
  StreamRecord,
  UsersMetaRecord
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/helpers/types'
import {
  getCommitBranches,
  getCommits,
  getSpecificBranchCommits,
  getStreamCommitCounts
} from '@/modules/core/repositories/commits'
import { ResourceIdentifier, Scope } from '@/modules/core/graph/generated/graphql'
import {
  getBranchCommentCounts,
  getCommentParents,
  getCommentReplyAuthorIds,
  getCommentReplyCounts,
  getCommentsResources,
  getCommentsViewedAt,
  getCommitCommentCounts,
  getStreamCommentCounts
} from '@/modules/comments/repositories/comments'
import {
  getBranchCommitCounts,
  getBranchesByIds,
  getBranchLatestCommits,
  getStreamBranchCounts,
  getStreamBranchesByName
} from '@/modules/core/repositories/branches'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { Users } from '@/modules/core/dbSchema'
import { getStreamPendingModels } from '@/modules/fileuploads/repositories/fileUploads'
import { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { getAutomationFunctionRunResultVersions } from '@/modules/automations/repositories/automations'
import { getAppScopes } from '@/modules/auth/repositories'

/**
 * TODO: Lazy load DataLoaders to reduce memory usage
 * - Instead of keeping them request scoped, cache them identified by request (user ID) with a TTL,
 * so that users with the same ID can re-use them across requests/subscriptions
 */

const makeSelfClearingDataloader = <K, V, C = K>(
  batchLoadFn: DataLoader.BatchLoadFn<K, V>,
  options?: DataLoader.Options<K, V, C>
) => {
  const dataloader = new DataLoader<K, V, C>((ids) => {
    dataloader.clearAll()
    return batchLoadFn(ids)
  }, options)
  return dataloader
}

const buildDataLoaderCreator = (selfClearing = false) => {
  return <K, V, C = K>(
    batchLoadFn: DataLoader.BatchLoadFn<K, V>,
    options?: DataLoader.Options<K, V, C>
  ) => {
    if (selfClearing) {
      return makeSelfClearingDataloader<K, V, C>(batchLoadFn, {
        ...(options || {}),
        cacheMap: null,
        cache: false
      })
    } else {
      return new DataLoader<K, V, C>(batchLoadFn, options)
    }
  }
}

/**
 * Build request-scoped dataloaders
 * @param ctx GraphQL context w/o loaders
 */
export function buildRequestLoaders(
  ctx: AuthContext,
  options?: Partial<{ cleanLoadersEarly: boolean }>
) {
  const userId = ctx.userId

  const createLoader = buildDataLoaderCreator(options?.cleanLoadersEarly || false)

  const loaders = {
    streams: {
      /**
       * Get a specific commit of a specific stream. Each stream ID technically has its own loader &
       * thus its own query.
       */
      getStreamCommit: (() => {
        type CommitDataLoader = DataLoader<string, Nullable<CommitRecord>>
        const streamCommitLoaders = new Map<string, CommitDataLoader>()
        return {
          clearAll: () => streamCommitLoaders.clear(),
          forStream(streamId: string): CommitDataLoader {
            let loader = streamCommitLoaders.get(streamId)
            if (!loader) {
              loader = createLoader<string, Nullable<CommitRecord>>(
                async (commitIds) => {
                  const results = keyBy(
                    await getCommits(commitIds.slice(), { streamId }),
                    'id'
                  )
                  return commitIds.map((i) => results[i] || null)
                }
              )
              streamCommitLoaders.set(streamId, loader)
            }

            return loader
          }
        }
      })(),

      /**
       * Get favorite metadata for a specific stream and user
       */
      getUserFavoriteData: createLoader<string, Nullable<StreamFavoriteRecord>>(
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
      getFavoritesCount: createLoader<string, number>(async (streamIds) => {
        const results = await getBatchStreamFavoritesCounts(streamIds.slice())
        return streamIds.map((k) => results[k] || 0)
      }),

      /**
       * Get total amount of favorites of owned streams
       */
      getOwnedFavoritesCount: createLoader<string, number>(async (userIds) => {
        const results = await getOwnedFavoritesCountByUserIds(userIds.slice())
        return userIds.map((i) => results[i] || 0)
      }),

      /**
       * Get stream from DB
       *
       * Note: Considering the difficulty of writing a single query that queries for multiple stream IDs
       * and multiple user IDs also, currently this dataloader will only use a single userId
       */
      getStream: createLoader<string, Nullable<StreamRecord>>(async (streamIds) => {
        const results = keyBy(await getStreams(streamIds.slice()), 'id')
        return streamIds.map((i) => results[i] || null)
      }),

      /**
       * Get stream role from DB
       */
      getRole: createLoader<string, Nullable<string>>(async (streamIds) => {
        if (!userId) return streamIds.map(() => null)

        const results = await getStreamRoles(userId, streamIds.slice())
        return streamIds.map((id) => results[id] || null)
      }),
      getBranchCount: createLoader<string, number>(async (streamIds) => {
        const results = keyBy(
          await getStreamBranchCounts(streamIds.slice()),
          'streamId'
        )
        return streamIds.map((i) => results[i]?.count || 0)
      }),
      getCommitCountWithoutGlobals: createLoader<string, number>(async (streamIds) => {
        const results = keyBy(
          await getStreamCommitCounts(streamIds.slice(), {
            ignoreGlobalsBranch: true
          }),
          'streamId'
        )
        return streamIds.map((i) => results[i]?.count || 0)
      }),
      getCommentThreadCount: createLoader<string, number>(async (streamIds) => {
        const results = keyBy(
          await getStreamCommentCounts(streamIds.slice(), { threadsOnly: true }),
          'streamId'
        )
        return streamIds.map((i) => results[i]?.count || 0)
      }),
      getSourceApps: createLoader<string, string[]>(async (streamIds) => {
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
          clearAll: () => streamBranchLoaders.clear(),
          forStream(streamId: string): BranchDataLoader {
            let loader = streamBranchLoaders.get(streamId)
            if (!loader) {
              loader = createLoader<string, Nullable<BranchRecord>>(
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
      })(),
      /**
       * Get a specific branch of a specific stream. Each stream ID technically has its own loader &
       * thus its own query.
       */
      getStreamPendingBranchByName: (() => {
        type BranchDataLoader = DataLoader<string, Nullable<FileUploadRecord>>
        const streamBranchLoaders = new Map<string, BranchDataLoader>()
        return {
          clearAll: () => streamBranchLoaders.clear(),
          forStream(streamId: string): BranchDataLoader {
            let loader = streamBranchLoaders.get(streamId)
            if (!loader) {
              loader = createLoader<string, Nullable<FileUploadRecord>>(
                async (branchNames) => {
                  const results = keyBy(
                    await getStreamPendingModels(streamId, {
                      branchNamePattern: `(${branchNames.slice().join('|')})`
                    }),
                    'branchName'
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
      getCommitCount: createLoader<string, number>(async (branchIds) => {
        const results = keyBy(await getBranchCommitCounts(branchIds.slice()), 'id')
        return branchIds.map((i) => results[i]?.count || 0)
      }),
      getLatestCommit: createLoader<string, Nullable<CommitRecord>>(
        async (branchIds) => {
          const results = keyBy(
            await getBranchLatestCommits(branchIds.slice()),
            'branchId'
          )
          return branchIds.map((i) => results[i] || null)
        }
      ),
      getCommentThreadCount: createLoader<string, number>(async (branchIds) => {
        const results = keyBy(
          await getBranchCommentCounts(branchIds.slice(), { threadsOnly: true }),
          'id'
        )
        return branchIds.map((i) => results[i]?.count || 0)
      }),
      getById: createLoader<string, Nullable<BranchRecord>>(async (branchIds) => {
        const results = keyBy(await getBranchesByIds(branchIds.slice()), 'id')
        return branchIds.map((i) => results[i] || null)
      }),
      getBranchCommit: createLoader<
        { branchId: string; commitId: string },
        Nullable<CommitRecord>,
        string
      >(
        async (idPairs) => {
          const results = keyBy(await getSpecificBranchCommits(idPairs.slice()), 'id')
          return idPairs.map((p) => {
            const commit = results[p.commitId]
            return commit?.id === p.commitId && commit?.branchId === p.branchId
              ? commit
              : null
          })
        },
        { cacheKeyFn: (key) => `${key.branchId}:${key.commitId}` }
      )
    },
    commits: {
      /**
       * Get a commit's stream from DB
       */
      getCommitStream: createLoader<string, Nullable<StreamWithCommitId>>(
        async (commitIds) => {
          const results = keyBy(
            await getCommitStreams({ commitIds: commitIds.slice(), userId }),
            'commitId'
          )
          return commitIds.map((id) => results[id] || null)
        }
      ),

      getCommitBranch: createLoader<string, Nullable<BranchRecord>>(
        async (commitIds) => {
          const results = keyBy(await getCommitBranches(commitIds.slice()), 'commitId')
          return commitIds.map((id) => results[id] || null)
        }
      ),
      getCommentThreadCount: createLoader<string, number>(async (commitIds) => {
        const results = keyBy(
          await getCommitCommentCounts(commitIds.slice(), { threadsOnly: true }),
          'commitId'
        )
        return commitIds.map((i) => results[i]?.count || 0)
      })
    },
    comments: {
      getViewedAt: createLoader<string, Nullable<Date>>(async (commentIds) => {
        if (!userId) return commentIds.slice().map(() => null)

        const results = keyBy(
          await getCommentsViewedAt(commentIds.slice(), userId),
          'commentId'
        )
        return commentIds.map((id) => results[id]?.viewedAt || null)
      }),
      getResources: createLoader<string, ResourceIdentifier[]>(async (commentIds) => {
        const results = await getCommentsResources(commentIds.slice())
        return commentIds.map((id) => results[id]?.resources || [])
      }),
      getReplyCount: createLoader<string, number>(async (threadIds) => {
        const results = keyBy(
          await getCommentReplyCounts(threadIds.slice()),
          'threadId'
        )
        return threadIds.map((id) => results[id]?.count || 0)
      }),
      getReplyAuthorIds: createLoader<string, string[]>(async (threadIds) => {
        const results = await getCommentReplyAuthorIds(threadIds.slice())
        return threadIds.map((id) => results[id] || [])
      }),
      getReplyParent: createLoader<string, Nullable<CommentRecord>>(
        async (replyIds) => {
          const results = keyBy(await getCommentParents(replyIds.slice()), 'replyId')
          return replyIds.map((id) => results[id] || null)
        }
      )
    },
    users: {
      /**
       * Get user from DB
       */
      getUser: createLoader<string, Nullable<UserWithOptionalRole<LimitedUserRecord>>>(
        async (userIds) => {
          const results = keyBy(
            await getUsers(userIds.slice(), { withRole: true }),
            'id'
          )
          return userIds.map((i) => results[i] || null)
        }
      ),

      /**
       * Get meta values associated with one or more users
       */
      getUserMeta: createLoader<
        { userId: string; key: keyof (typeof Users)['meta']['metaKey'] },
        Nullable<UsersMetaRecord & { id: string }>,
        string
      >(
        async (requests) => {
          const meta = metaHelpers<UsersMetaRecord, typeof Users>(Users)
          const results = await meta.getMultiple(
            requests.map((r) => ({
              id: r.userId,
              key: r.key
            }))
          )
          return requests.map((r) => {
            const resultItem = results[r.userId]?.[r.key]
            return resultItem
              ? { ...resultItem, id: meta.getGraphqlId(resultItem) }
              : null
          })
        },
        { cacheKeyFn: (key) => `${key.userId}:${key.key}` }
      )
    },
    invites: {
      /**
       * Get invite from DB
       */
      getInvite: createLoader<string, Nullable<ServerInviteRecord>>(
        async (inviteIds) => {
          const results = keyBy(await getInvites(inviteIds), 'id')
          return inviteIds.map((i) => results[i] || null)
        }
      )
    },
    apps: {
      getAppScopes: createLoader<string, Array<Scope>>(async (appIds) => {
        const results = await getAppScopes(appIds.slice())
        return appIds.map((i) => results[i] || [])
      })
    },
    automationFunctionRuns: {
      /**
       * Get result versions/commits from function runs
       */
      getResultVersions: createLoader<
        [automationRunId: string, functionId: string],
        CommitRecord[],
        string
      >(
        async (ids) => {
          const results = await getAutomationFunctionRunResultVersions(ids.slice())
          return ids.map((i) => {
            const [automationRunId, functionId] = i
            return results[automationRunId]?.[functionId] || []
          })
        },
        { cacheKeyFn: (key) => `${key[0]}:${key[1]}` }
      )
    }
  }

  /**
   * Clear all loaders
   */
  const clearAll = () => {
    for (const groupedLoaders of Object.values(loaders)) {
      for (const loaderItem of Object.values(groupedLoaders)) {
        ;(loaderItem as DataLoader<unknown, unknown>).clearAll()
      }
    }
  }

  return {
    ...loaders,
    clearAll
  }
}

export type RequestDataLoaders = ReturnType<typeof buildRequestLoaders>
