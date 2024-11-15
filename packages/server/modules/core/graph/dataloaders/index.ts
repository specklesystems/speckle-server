import {
  defineRequestDataloaders,
  simpleTupleCacheKey
} from '@/modules/shared/helpers/graphqlHelper'
import DataLoader from 'dataloader'
import {
  getStreamsFactory,
  getCommitStreamsFactory,
  getBatchUserFavoriteDataFactory,
  getBatchStreamFavoritesCountsFactory,
  getOwnedFavoritesCountByUserIdsFactory,
  getStreamRolesFactory,
  getUserStreamCountsFactory,
  getStreamsSourceAppsFactory
} from '@/modules/core/repositories/streams'
import { keyBy } from 'lodash'
import {
  BranchRecord,
  CommitRecord,
  StreamFavoriteRecord,
  StreamRecord,
  UsersMetaRecord
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import {
  getCommitBranchesFactory,
  getCommitsFactory,
  getSpecificBranchCommitsFactory,
  getStreamCommitCountsFactory,
  getUserAuthoredCommitCountsFactory,
  getUserStreamCommitCountsFactory
} from '@/modules/core/repositories/commits'
import { ResourceIdentifier, Scope } from '@/modules/core/graph/generated/graphql'
import {
  getBranchCommentCountsFactory,
  getCommentParentsFactory,
  getCommentReplyAuthorIdsFactory,
  getCommentReplyCountsFactory,
  getCommentsResourcesFactory,
  getCommentsViewedAtFactory,
  getCommitCommentCountsFactory,
  getStreamCommentCountsFactory
} from '@/modules/comments/repositories/comments'
import {
  getBranchCommitCountsFactory,
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchCountsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { Users } from '@/modules/core/dbSchema'
import { getStreamPendingModelsFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import {
  AutomateRevisionFunctionRecord,
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationRunTriggerRecord,
  AutomationTriggerDefinitionRecord
} from '@/modules/automate/helpers/types'
import {
  getAutomationRevisionsFactory,
  getAutomationRunsTriggersFactory,
  getAutomationsFactory,
  getFunctionAutomationCountsFactory,
  getLatestAutomationRevisionsFactory,
  getRevisionsFunctionsFactory,
  getRevisionsTriggerDefinitionsFactory
} from '@/modules/automate/repositories/automations'
import {
  getFunction,
  getFunctionReleases
} from '@/modules/automate/clients/executionEngine'
import {
  FunctionReleaseSchemaType,
  FunctionSchemaType
} from '@/modules/automate/helpers/executionEngine'
import {
  ExecutionEngineFailedResponseError,
  ExecutionEngineNetworkError
} from '@/modules/automate/errors/executionEngine'
import { queryInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { getAppScopesFactory } from '@/modules/auth/repositories'
import { StreamWithCommitId } from '@/modules/core/domain/streams/types'
import {
  getUsersFactory,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import {
  CommitWithStreamBranchId,
  CommitWithStreamBranchMetadata
} from '@/modules/core/domain/commits/types'

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders extends ReturnType<typeof dataLoadersDefinition> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ ctx, createLoader, deps: { db } }) => {
    const userId = ctx.userId

    const getStreams = getStreamsFactory({ db })
    const getStreamPendingModels = getStreamPendingModelsFactory({ db })
    const getAppScopes = getAppScopesFactory({ db })
    const getAutomations = getAutomationsFactory({ db })
    const getAutomationRevisions = getAutomationRevisionsFactory({ db })
    const getLatestAutomationRevisions = getLatestAutomationRevisionsFactory({ db })
    const getRevisionsTriggerDefinitions = getRevisionsTriggerDefinitionsFactory({ db })
    const getRevisionsFunctions = getRevisionsFunctionsFactory({ db })
    const getFunctionAutomationCounts = getFunctionAutomationCountsFactory({ db })
    const getStreamCommentCounts = getStreamCommentCountsFactory({ db })
    const getAutomationRunsTriggers = getAutomationRunsTriggersFactory({ db })
    const getCommentsResources = getCommentsResourcesFactory({ db })
    const getCommentsViewedAt = getCommentsViewedAtFactory({ db })
    const getCommitCommentCounts = getCommitCommentCountsFactory({ db })
    const getBranchCommentCounts = getBranchCommentCountsFactory({ db })
    const getCommentReplyCounts = getCommentReplyCountsFactory({ db })
    const getCommentReplyAuthorIds = getCommentReplyAuthorIdsFactory({ db })
    const getCommentParents = getCommentParentsFactory({ db })
    const getBranchesByIds = getBranchesByIdsFactory({ db })
    const getStreamBranchesByName = getStreamBranchesByNameFactory({ db })
    const getBranchLatestCommits = getBranchLatestCommitsFactory({ db })
    const getStreamBranchCounts = getStreamBranchCountsFactory({ db })
    const getBranchCommitCounts = getBranchCommitCountsFactory({ db })
    const getCommits = getCommitsFactory({ db })
    const getSpecificBranchCommits = getSpecificBranchCommitsFactory({ db })
    const getCommitBranches = getCommitBranchesFactory({ db })
    const getStreamCommitCounts = getStreamCommitCountsFactory({ db })
    const getUserStreamCommitCounts = getUserStreamCommitCountsFactory({ db })
    const getUserAuthoredCommitCounts = getUserAuthoredCommitCountsFactory({ db })
    const getCommitStreams = getCommitStreamsFactory({ db })
    const getBatchUserFavoriteData = getBatchUserFavoriteDataFactory({ db })
    const getBatchStreamFavoritesCounts = getBatchStreamFavoritesCountsFactory({ db })
    const getOwnedFavoritesCountByUserIds = getOwnedFavoritesCountByUserIdsFactory({
      db
    })
    const getStreamRoles = getStreamRolesFactory({ db })
    const getUserStreamCounts = getUserStreamCountsFactory({ db })
    const getStreamsSourceApps = getStreamsSourceAppsFactory({ db })
    const getUsers = getUsersFactory({ db })

    return {
      streams: {
        getAutomation: (() => {
          type AutomationDataLoader = DataLoader<string, Nullable<AutomationRecord>>
          const streamAutomationLoaders = new Map<string, AutomationDataLoader>()
          return {
            clearAll: () => streamAutomationLoaders.clear(),
            forStream(streamId: string): AutomationDataLoader {
              let loader = streamAutomationLoaders.get(streamId)
              if (!loader) {
                loader = createLoader<string, Nullable<AutomationRecord>>(
                  async (automationIds) => {
                    const results = keyBy(
                      await getAutomations({ automationIds: automationIds.slice() }),
                      (a) => a.id
                    )
                    return automationIds.map((i) => results[i] || null)
                  }
                )
                streamAutomationLoaders.set(streamId, loader)
              }

              return loader
            }
          }
        })(),

        /**
         * Get a specific commit of a specific stream. Each stream ID technically has its own loader &
         * thus its own query.
         */
        getStreamCommit: (() => {
          type CommitDataLoader = DataLoader<
            string,
            Nullable<CommitWithStreamBranchMetadata>
          >
          const streamCommitLoaders = new Map<string, CommitDataLoader>()
          return {
            clearAll: () => streamCommitLoaders.clear(),
            forStream(streamId: string): CommitDataLoader {
              let loader = streamCommitLoaders.get(streamId)
              if (!loader) {
                loader = createLoader<string, Nullable<CommitWithStreamBranchMetadata>>(
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
        /**
         * Works in FE2 mode - skips `main` if it doesn't have any versions
         */
        getBranchCount: createLoader<string, number>(async (streamIds) => {
          const results = keyBy(
            await getStreamBranchCounts(streamIds.slice(), { skipEmptyMain: true }),
            'streamId'
          )
          return streamIds.map((i) => results[i]?.count || 0)
        }),
        getCommitCountWithoutGlobals: createLoader<string, number>(
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
         * Get a specific pending model (upload) of a specific stream. Each stream ID technically has its own loader &
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
          Nullable<CommitWithStreamBranchId>,
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
            const results = keyBy(
              await getCommitBranches(commitIds.slice()),
              'commitId'
            )
            return commitIds.map((id) => results[id] || null)
          }
        ),
        getCommentThreadCount: createLoader<string, number>(async (commitIds) => {
          const results = keyBy(
            await getCommitCommentCounts(commitIds.slice(), { threadsOnly: true }),
            'commitId'
          )
          return commitIds.map((i) => results[i]?.count || 0)
        }),
        getById: createLoader<string, Nullable<CommitRecord>>(async (commitIds) => {
          const results = keyBy(await getCommits(commitIds.slice()), (c) => c.id)
          return commitIds.map((i) => results[i] || null)
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
        getUser: createLoader<string, Nullable<UserWithOptionalRole>>(
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
            const meta = metaHelpers<UsersMetaRecord, typeof Users>(Users, db)
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
        ),

        /**
         * Get user stream count. Includes private streams.
         */
        getOwnStreamCount: createLoader<string, number>(async (userIds) => {
          const results = await getUserStreamCounts({
            publicOnly: false,
            userIds: userIds.slice()
          })
          return userIds.map((i) => results[i] || 0)
        }),

        /**
         * Get authored commit count. Includes commits from private streams.
         */
        getAuthoredCommitCount: createLoader<string, number>(async (userIds) => {
          const results = await getUserAuthoredCommitCounts({
            userIds: userIds.slice(),
            publicOnly: false
          })

          return userIds.map((i) => results[i] || 0)
        }),

        /**
         * Get count of commits in streams that the user is a contributor in. Includes private streams.
         */
        getStreamCommitCount: createLoader<string, number>(async (userIds) => {
          const results = await getUserStreamCommitCounts({
            userIds: userIds.slice(),
            publicOnly: false
          })

          return userIds.map((i) => results[i] || 0)
        })
      },
      invites: {
        /**
         * Get invite from DB
         */
        getInvite: createLoader<string, Nullable<ServerInviteRecord>>(
          async (inviteIds) => {
            const results = keyBy(await queryInvitesFactory({ db })(inviteIds), 'id')
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
      automations: {
        getFunctionAutomationCount: createLoader<string, number>(
          async (functionIds) => {
            const results = await getFunctionAutomationCounts({
              functionIds: functionIds.slice()
            })
            return functionIds.map((i) => results[i] || 0)
          }
        ),
        getAutomation: createLoader<string, Nullable<AutomationRecord>>(async (ids) => {
          const results = keyBy(
            await getAutomations({ automationIds: ids.slice() }),
            (a) => a.id
          )
          return ids.map((i) => results[i] || null)
        }),
        getAutomationRevision: createLoader<string, Nullable<AutomationRevisionRecord>>(
          async (ids) => {
            const results = keyBy(
              await getAutomationRevisions({ automationRevisionIds: ids.slice() }),
              (a) => a.id
            )
            return ids.map((i) => results[i] || null)
          }
        ),
        getLatestAutomationRevision: createLoader<
          string,
          Nullable<AutomationRevisionRecord>
        >(async (ids) => {
          const results = await getLatestAutomationRevisions({
            automationIds: ids.slice()
          })
          return ids.map((i) => results[i] || null)
        }),
        getRevisionTriggerDefinitions: createLoader<
          string,
          AutomationTriggerDefinitionRecord[]
        >(async (ids) => {
          const results = await getRevisionsTriggerDefinitions({
            automationRevisionIds: ids.slice()
          })
          return ids.map((i) => results[i] || [])
        }),
        getRevisionFunctions: createLoader<string, AutomateRevisionFunctionRecord[]>(
          async (ids) => {
            const results = await getRevisionsFunctions({
              automationRevisionIds: ids.slice()
            })
            return ids.map((i) => results[i] || [])
          }
        ),
        getRunTriggers: createLoader<string, AutomationRunTriggerRecord[]>(
          async (ids) => {
            const results = await getAutomationRunsTriggers({
              automationRunIds: ids.slice()
            })
            return ids.map((i) => results[i] || [])
          }
        )
      },
      automationsApi: {
        getFunction: createLoader<string, Nullable<FunctionSchemaType>>(
          async (fnIds) => {
            const results = await Promise.all(
              fnIds.map(async (fnId) => {
                try {
                  return await getFunction({ functionId: fnId })
                } catch (e) {
                  const isNotFound =
                    e instanceof ExecutionEngineFailedResponseError &&
                    e.response.statusMessage === 'FunctionNotFound'
                  if (e instanceof ExecutionEngineNetworkError || isNotFound) {
                    return null
                  }

                  throw e
                }
              })
            )

            return results
          }
        ),
        getFunctionRelease: createLoader<
          [fnId: string, fnReleaseId: string],
          Nullable<FunctionReleaseSchemaType>,
          string
        >(
          async (keys) => {
            const results = keyBy(
              await getFunctionReleases({
                ids: keys.map(([fnId, fnReleaseId]) => ({
                  functionId: fnId,
                  functionReleaseId: fnReleaseId
                }))
              }),
              (r) => simpleTupleCacheKey([r.functionId, r.functionVersionId])
            )

            return keys.map((k) => results[simpleTupleCacheKey(k)] || null)
          },
          { cacheKeyFn: simpleTupleCacheKey }
        )
      }
    }
  }
)

export default dataLoadersDefinition
