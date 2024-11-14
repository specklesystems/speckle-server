import {
  CommentLinkRecord,
  CommentRecord,
  CommentLinkResourceType,
  CommentViewRecord
} from '@/modules/comments/helpers/types'
import {
  BranchCommits,
  Branches,
  CommentLinks,
  Comments,
  CommentViews,
  Commits,
  knex,
  Objects,
  StreamCommits
} from '@/modules/core/dbSchema'
import {
  ResourceIdentifier,
  ResourceType
} from '@/modules/core/graph/generated/graphql'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { clamp, keyBy, reduce } from 'lodash'
import crs from 'crypto-random-string'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { isNullOrUndefined, SpeckleViewer } from '@speckle/shared'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { Merge } from 'type-fest'
import {
  CheckStreamResourceAccess,
  DeleteComment,
  GetBatchedStreamComments,
  GetBranchCommentCounts,
  GetComment,
  GetCommentParents,
  GetCommentReplyAuthorIds,
  GetCommentReplyCounts,
  GetCommentsResources,
  GetCommitCommentCounts,
  GetPaginatedBranchCommentsPage,
  GetPaginatedCommitCommentsPage,
  GetPaginatedCommitCommentsTotalCount,
  GetPaginatedProjectCommentsPage,
  GetPaginatedProjectCommentsTotalCount,
  GetUserCommentsViewedAt,
  InsertCommentLinks,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  PaginatedBranchCommentsParams,
  PaginatedCommitCommentsParams,
  PaginatedProjectCommentsParams,
  ResolvePaginatedProjectCommentsLatestModelResources,
  UpdateComment
} from '@/modules/comments/domain/operations'
import {
  BranchRecord,
  CommitRecord,
  ObjectRecord,
  StreamCommitRecord
} from '@/modules/core/helpers/types'
import { ExtendedComment } from '@/modules/comments/domain/types'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'
import { getBranchLatestCommitsFactory } from '@/modules/core/repositories/branches'

const tables = {
  streamCommits: (db: Knex) => db<StreamCommitRecord>(StreamCommits.name),
  objects: (db: Knex) => db<ObjectRecord>(Objects.name),
  comments: (db: Knex) => db<CommentRecord>(Comments.name),
  commentLinks: (db: Knex) => db<CommentLinkRecord>(CommentLinks.name),
  commentViews: (db: Knex) => db<CommentViewRecord>(CommentViews.name),
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  branches: (db: Knex) => db<BranchRecord>(Branches.name)
}

export const generateCommentId = () => crs({ length: 10 })

/**
 * Get a single comment
 */
export const getCommentFactory =
  (deps: { db: Knex }): GetComment =>
  async (params: { id: string; userId?: string }) => {
    const { id, userId = null } = params

    const query = tables.comments(deps.db).select<ExtendedComment>('*').joinRaw(`
        join(
          select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
          from comment_links cl
          join comments on comments.id = cl."commentId"
          group by cl."commentId"
        ) res using(id)`)
    if (userId) {
      query.leftOuterJoin('comment_views', (b) => {
        b.on('comment_views.commentId', '=', 'comments.id')
        b.andOn('comment_views.userId', '=', knex.raw('?', userId))
      })
    }
    query.where({ id }).first()
    return await query
  }

/**
 * Get resources array for the specified comments. Results object is keyed by comment ID.
 */
export const getCommentsResourcesFactory =
  (deps: { db: Knex }): GetCommentsResources =>
  async (commentIds: string[]) => {
    if (!commentIds.length) return {}

    const q = tables
      .commentLinks(deps.db)
      .select<{ commentId: string; resources: ResourceIdentifier[] }[]>([
        CommentLinks.col.commentId,
        knex.raw(
          `JSON_AGG(json_build_object('resourceId', "resourceId", 'resourceType', "resourceType")) as resources`
        )
      ])
      .whereIn(CommentLinks.col.commentId, commentIds)
      .groupBy(CommentLinks.col.commentId)

    const results = await q
    return keyBy(results, 'commentId')
  }

export const getCommentsViewedAtFactory =
  (deps: { db: Knex }): GetUserCommentsViewedAt =>
  async (commentIds: string[], userId: string) => {
    if (!commentIds?.length || !userId) return []

    const q = tables
      .commentViews(deps.db)
      .where(CommentViews.col.userId, userId)
      .whereIn(CommentViews.col.commentId, commentIds)

    return await q
  }

export const getBatchedStreamCommentsFactory =
  (deps: { db: Knex }): GetBatchedStreamComments =>
  (streamId, options) => {
    const { withoutParentCommentOnly = false, withParentCommentOnly = false } =
      options || {}

    const baseQuery = tables
      .comments(deps.db)
      .select<CommentRecord[]>('*')
      .where(Comments.col.streamId, streamId)
      .orderBy(Comments.col.id)

    if (withoutParentCommentOnly) {
      baseQuery.andWhere(Comments.col.parentComment, null)
    } else if (withParentCommentOnly) {
      baseQuery.andWhereNot(Comments.col.parentComment, null)
    }

    return executeBatchedSelect(baseQuery, options)
  }

export const getCommentLinksFactory =
  (deps: { db: Knex }) =>
  async (commentIds: string[], options?: Partial<{ trx: Knex.Transaction }>) => {
    const q = tables
      .commentLinks(deps.db)
      .whereIn(CommentLinks.col.commentId, commentIds)

    if (options?.trx) q.transacting(options.trx)

    return await q
  }

export const insertCommentsFactory =
  (deps: { db: Knex }): InsertComments =>
  async (comments, options) => {
    const q = tables.comments(deps.db).insert(
      comments.map((c) => ({
        ...c,
        id: c.id || generateCommentId()
      })),
      '*'
    )
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

export const insertCommentLinksFactory =
  (deps: { db: Knex }): InsertCommentLinks =>
  async (commentLinks, options) => {
    const q = tables.commentLinks(deps.db).insert(commentLinks, '*')
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

export const getStreamCommentCountsFactory =
  (deps: { db: Knex }) =>
  async (
    streamIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
    if (!streamIds?.length) return []
    const { threadsOnly, includeArchived } = options || {}
    const q = tables
      .comments(deps.db)
      .select(Comments.col.streamId)
      .whereIn(Comments.col.streamId, streamIds)
      .count()
      .groupBy(Comments.col.streamId)

    if (threadsOnly) {
      q.andWhere(Comments.col.parentComment, null)
    }

    if (!includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    const results = (await q) as { streamId: string; count: string }[]
    return results.map((r) => ({ ...r, count: parseInt(r.count) }))
  }

export const getCommitCommentCountsFactory =
  (deps: { db: Knex }): GetCommitCommentCounts =>
  async (
    commitIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
    if (!commitIds?.length) return []
    const { threadsOnly, includeArchived } = options || {}

    const q = tables
      .commentLinks(deps.db)
      .select(CommentLinks.col.resourceId)
      .where(CommentLinks.col.resourceType, ResourceType.Commit)
      .whereIn(CommentLinks.col.resourceId, commitIds)
      .count()
      .groupBy(CommentLinks.col.resourceId)

    if (threadsOnly || !includeArchived) {
      q.innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)

      if (threadsOnly) {
        q.where(Comments.col.parentComment, null)
      }

      if (!includeArchived) {
        q.where(Comments.col.archived, false)
      }
    }

    const results = (await q) as { resourceId: string; count: string }[]
    return results.map((r) => ({ commitId: r.resourceId, count: parseInt(r.count) }))
  }

export const getStreamCommentCountFactory =
  (deps: { db: Knex }) =>
  async (
    streamId: string,
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
    const [res] = await getStreamCommentCountsFactory(deps)([streamId], options)
    return res?.count || 0
  }

export const getBranchCommentCountsFactory =
  (deps: { db: Knex }): GetBranchCommentCounts =>
  async (
    branchIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
    if (!branchIds.length) return []
    const { threadsOnly, includeArchived } = options || {}

    const q = tables
      .branches(deps.db)
      .select(Branches.col.id)
      .whereIn(Branches.col.id, branchIds)
      .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .innerJoin(CommentLinks.name, function () {
        this.on(CommentLinks.col.resourceId, BranchCommits.col.commitId).andOnVal(
          CommentLinks.col.resourceType,
          'commit' as CommentLinkResourceType
        )
      })
      .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
      .count()
      .groupBy(Branches.col.id)

    if (threadsOnly) {
      q.andWhere(Comments.col.parentComment, null)
    }

    if (!includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    const results = (await q) as { id: string; count: string }[]
    return results.map((r) => ({ ...r, count: parseInt(r.count) }))
  }

export const getCommentReplyCountsFactory =
  (deps: { db: Knex }): GetCommentReplyCounts =>
  async (threadIds: string[], options?: Partial<{ includeArchived: boolean }>) => {
    if (!threadIds.length) return []
    const { includeArchived } = options || {}

    const q = tables
      .comments(deps.db)
      .select(Comments.col.parentComment)
      .whereIn(Comments.col.parentComment, threadIds)
      .count()
      .groupBy(Comments.col.parentComment)

    if (!includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    const results = (await q) as { parentComment: string; count: string }[]
    return results.map((r) => ({ threadId: r.parentComment, count: parseInt(r.count) }))
  }

export const getCommentReplyAuthorIdsFactory =
  (deps: { db: Knex }): GetCommentReplyAuthorIds =>
  async (threadIds: string[], options?: Partial<{ includeArchived: boolean }>) => {
    if (!threadIds.length) return {}
    const { includeArchived } = options || {}

    const q = tables
      .comments(deps.db)
      .select<{ parentComment: string; authorId: string }[]>([
        Comments.col.parentComment,
        Comments.col.authorId
      ])
      .whereIn(Comments.col.parentComment, threadIds)
      .groupBy(Comments.col.parentComment, Comments.col.authorId)

    if (!includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    const results = await q
    return reduce(
      results,
      (result, item) => {
        ;(result[item.parentComment] || (result[item.parentComment] = [])).push(
          item.authorId
        )
        return result
      },
      {} as Record<string, string[]>
    )
  }

const getPaginatedCommitCommentsBaseQueryFactory =
  (deps: { db: Knex }) =>
  <T = CommentRecord[]>(
    params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
  ) => {
    const { commitId, filter } = params

    const q = tables
      .commits(deps.db)
      .select<T>(Comments.cols)
      .innerJoin(CommentLinks.name, function () {
        this.on(CommentLinks.col.resourceId, Commits.col.id).andOnVal(
          CommentLinks.col.resourceType,
          'commit' as CommentLinkResourceType
        )
      })
      .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
      .where(Commits.col.id, commitId)

    if (!filter?.includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    if (filter?.threadsOnly) {
      q.whereNull(Comments.col.parentComment)
    }

    return q
  }

export const getPaginatedCommitCommentsPageFactory =
  (deps: { db: Knex }): GetPaginatedCommitCommentsPage =>
  async (params: PaginatedCommitCommentsParams) => {
    const { cursor } = params

    const limit = clamp(params.limit, 0, 100)
    if (!limit) return { items: [], cursor: null }

    const q = getPaginatedCommitCommentsBaseQueryFactory(deps)(params)
      .orderBy(Comments.col.createdAt, 'desc')
      .limit(limit)

    if (cursor) {
      q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
    }

    const items = await q
    return {
      items,
      cursor: items.length
        ? encodeCursor(items[items.length - 1].createdAt.toISOString())
        : null
    }
  }

export const getPaginatedCommitCommentsTotalCountFactory =
  (deps: { db: Knex }): GetPaginatedCommitCommentsTotalCount =>
  async (params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>) => {
    const baseQ = getPaginatedCommitCommentsBaseQueryFactory(deps)(params)
    const q = deps.db.count<{ count: string }[]>().from(baseQ.as('sq1'))
    const [row] = await q

    return parseInt(row.count || '0')
  }

const getPaginatedBranchCommentsBaseQueryFactory =
  (deps: { db: Knex }) =>
  (params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>) => {
    const { branchId, filter } = params

    const q = tables
      .branches(deps.db)
      .distinct()
      .select<CommentRecord[]>(Comments.cols)
      .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .innerJoin(CommentLinks.name, function () {
        this.on(CommentLinks.col.resourceId, BranchCommits.col.commitId).andOnVal(
          CommentLinks.col.resourceType,
          'commit' as CommentLinkResourceType
        )
      })
      .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
      .where(Branches.col.id, branchId)

    if (!filter?.includeArchived) {
      q.andWhere(Comments.col.archived, false)
    }

    if (filter?.threadsOnly) {
      q.whereNull(Comments.col.parentComment)
    }

    return q
  }

export const getPaginatedBranchCommentsPageFactory =
  (deps: { db: Knex }): GetPaginatedBranchCommentsPage =>
  async (params: PaginatedBranchCommentsParams) => {
    const { cursor } = params

    const limit = clamp(params.limit, 0, 100)
    if (!limit) return { items: [], cursor: null }

    const q = getPaginatedBranchCommentsBaseQueryFactory(deps)(params)
      .orderBy(Comments.col.createdAt, 'desc')
      .limit(limit)

    if (cursor) {
      q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
    }

    const items = await q
    return {
      items,
      cursor: items.length
        ? encodeCursor(items[items.length - 1].createdAt.toISOString())
        : null
    }
  }

export const getPaginatedBranchCommentsTotalCountFactory =
  (deps: { db: Knex }) =>
  async (params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>) => {
    const baseQ = getPaginatedBranchCommentsBaseQueryFactory(deps)(params)
    const q = deps.db.count<{ count: string }[]>().from(baseQ.as('sq1'))
    const [row] = await q

    return parseInt(row.count || '0')
  }

/**
 * Used exclusively in paginated project comment retrieval to resolve latest commit IDs for
 * model resource identifiers that just target latest (no versionId specified). This is required
 * when we only wish to load comment threads for loaded resources.
 */
export const resolvePaginatedProjectCommentsLatestModelResourcesFactory =
  (deps: { db: Knex }): ResolvePaginatedProjectCommentsLatestModelResources =>
  async (resourceIdString) => {
    if (!resourceIdString?.length) return []
    const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(resourceIdString)
    const modelResources = resources.filter(SpeckleViewer.ViewerRoute.isModelResource)
    if (!modelResources.length) return []

    const latestModelResources = modelResources.filter((r) => !r.versionId)
    if (!latestModelResources.length) return []

    return await getBranchLatestCommitsFactory(deps)(
      latestModelResources.map((r) => r.modelId)
    )
  }

const getPaginatedProjectCommentsBaseQueryFactory =
  (deps: { db: Knex }) =>
  async (
    params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
    options?: {
      preloadedModelLatestVersions?: BranchLatestCommit[]
    }
  ) => {
    const resolvePaginatedProjectCommentsLatestModelResources =
      resolvePaginatedProjectCommentsLatestModelResourcesFactory(deps)

    const { projectId, filter } = params
    const allModelVersions = filter?.allModelVersions || false

    const resources = filter?.resourceIdString
      ? SpeckleViewer.ViewerRoute.parseUrlParameters(filter.resourceIdString)
      : []
    const objectResources = resources.filter(SpeckleViewer.ViewerRoute.isObjectResource)
    const modelResources = resources.filter(SpeckleViewer.ViewerRoute.isModelResource)
    const folderResources = resources.filter(
      SpeckleViewer.ViewerRoute.isModelFolderResource
    )

    // If loaded models only, we need to resolve target versions for model resources that target 'latest'
    // (versionId is undefined)
    if (!allModelVersions) {
      const latestModelResources = modelResources.filter((r) => !r.versionId)
      if (latestModelResources.length) {
        const resolvedResourceItems = keyBy(
          options?.preloadedModelLatestVersions ||
            (await resolvePaginatedProjectCommentsLatestModelResources(
              filter?.resourceIdString
            )),
          'branchId'
        )

        for (const r of modelResources) {
          if (r.versionId) continue
          const versionId = resolvedResourceItems[r.modelId]?.id
          if (!versionId) continue

          r.versionId = versionId
        }
      }
    }

    const resolvedModelResources = allModelVersions
      ? modelResources
      : modelResources.filter((r) => !!r.versionId)

    const q = tables.comments(deps.db).distinct().select<CommentRecord[]>(Comments.cols)

    q.where(Comments.col.streamId, projectId)

    if (resources.length) {
      // First join any necessary tables
      q.innerJoin(CommentLinks.name, CommentLinks.col.commentId, Comments.col.id)
      if (resolvedModelResources.length || folderResources.length) {
        q.leftJoin(BranchCommits.name, (j) => {
          j.on(BranchCommits.col.commitId, CommentLinks.col.resourceId).andOnVal(
            CommentLinks.col.resourceType,
            ResourceType.Commit
          )
        })
        q.leftJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
      }

      // Filter by resources
      q.andWhere((w1) => {
        if (objectResources.length) {
          w1.orWhere((w2) => {
            w2.where(CommentLinks.col.resourceType, ResourceType.Object).whereIn(
              CommentLinks.col.resourceId,
              objectResources.map((o) => o.objectId)
            )
          })
        }

        if (resolvedModelResources.length) {
          w1.orWhere((w2) => {
            w2.where(CommentLinks.col.resourceType, ResourceType.Commit).where((w3) => {
              for (const modelResource of resolvedModelResources) {
                w3.orWhere((w4) => {
                  w4.where(Branches.col.id, modelResource.modelId)
                  if (modelResource.versionId && !allModelVersions) {
                    w4.andWhere(CommentLinks.col.resourceId, modelResource.versionId)
                  }
                })
              }
            })
          })
        }

        if (folderResources.length) {
          w1.orWhere((w2) => {
            w2.where(CommentLinks.col.resourceType, ResourceType.Commit).andWhere(
              knex.raw('LOWER(??) ilike ANY(?)', [
                Branches.col.name,
                folderResources.map((r) => r.folderName.toLowerCase() + '%')
              ])
            )
          })
        }
      })
    }

    if (!filter?.includeArchived && !filter?.archivedOnly) {
      q.andWhere(Comments.col.archived, false)
    } else if (filter?.archivedOnly) {
      q.andWhere(Comments.col.archived, true)
    }

    if (filter?.threadsOnly) {
      q.whereNull(Comments.col.parentComment)
    }

    // if we return `q` directly, it gets awaited as well
    return { baseQuery: q }
  }

export const getPaginatedProjectCommentsPageFactory =
  (deps: { db: Knex }): GetPaginatedProjectCommentsPage =>
  async (params, options) => {
    const { cursor } = params

    let limit: Optional<number> = undefined

    // If undefined limit, no limit at all - we need this for the viewer, where we kinda have to show all threads in the 3D space
    if (!isNullOrUndefined(params.limit)) {
      limit = Math.max(0, params.limit || 0)

      // limit=0, return nothing (req probably only interested in totalCount)
      if (!limit) return { items: [], cursor: null }
    }

    const { baseQuery } = await getPaginatedProjectCommentsBaseQueryFactory(deps)(
      params,
      options
    )
    const q = baseQuery.orderBy(Comments.col.createdAt, 'desc')

    if (limit) {
      q.limit(limit)
    }

    if (cursor) {
      q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
    }

    const items = await q
    return {
      items,
      cursor: items.length
        ? encodeCursor(items[items.length - 1].createdAt.toISOString())
        : null
    }
  }

export const getPaginatedProjectCommentsTotalCountFactory =
  (deps: { db: Knex }): GetPaginatedProjectCommentsTotalCount =>
  async (
    params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
    options?: {
      preloadedModelLatestVersions?: BranchLatestCommit[]
    }
  ) => {
    const { baseQuery } = await getPaginatedProjectCommentsBaseQueryFactory(deps)(
      params,
      options
    )
    const q = deps.db.count<{ count: string }[]>().from(baseQuery.as('sq1'))
    const [row] = await q

    return parseInt(row.count || '0')
  }

export const getCommentParentsFactory =
  (deps: { db: Knex }): GetCommentParents =>
  async (replyIds: string[]) => {
    const q = tables
      .comments(deps.db)
      .select<Array<CommentRecord & { replyId: string }>>([
        knex.raw('?? as "replyId"', [Comments.col.id]),
        knex.raw('"c2".*')
      ])
      .innerJoin(`${Comments.name} as c2`, `c2.id`, Comments.col.parentComment)
      .whereIn(Comments.col.id, replyIds)
      .whereNotNull(Comments.col.parentComment)
    return await q
  }

export const markCommentViewedFactory =
  (deps: { db: Knex }): MarkCommentViewed =>
  async (commentId: string, userId: string) => {
    const query = tables
      .commentViews(deps.db)
      .insert({ commentId, userId, viewedAt: knex.fn.now() })
      .onConflict(knex.raw('("commentId","userId")'))
      .merge()
    return !!(await query)
  }

export const markCommentUpdatedFactory =
  (deps: { db: Knex }): MarkCommentUpdated =>
  async (commentId: string) => {
    await updateCommentFactory(deps)(commentId, {
      updatedAt: new Date()
    })
  }

export const updateCommentFactory =
  (deps: { db: Knex }): UpdateComment =>
  async (
    id: string,
    input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
  ) => {
    const [res] = await tables
      .comments(deps.db)
      .where(Comments.col.id, id)
      .update(input, '*')
    return res as CommentRecord
  }

export const checkStreamResourceAccessFactory =
  (deps: { db: Knex }): CheckStreamResourceAccess =>
  async (res, streamId) => {
    // The switch of doom: if something throws, we're out
    switch (res.resourceType) {
      case 'stream':
        // Stream validity is already checked, so we can just go ahead.
        break
      case 'commit': {
        const linkage = await tables
          .streamCommits(deps.db)
          .select()
          .where({ commitId: res.resourceId, streamId })
          .first()
        if (!linkage) throw new Error('Commit not found')
        if (linkage.streamId !== streamId)
          throw new Error(
            'Stop hacking - that commit id is not part of the specified stream.'
          )
        break
      }
      case 'object': {
        const obj = await tables
          .objects(deps.db)
          .select()
          .where({ id: res.resourceId, streamId })
          .first()
        if (!obj) throw new Error('Object not found')
        break
      }
      case 'comment': {
        const comment = await tables
          .comments(deps.db)
          .where({ id: res.resourceId })
          .first()
        if (!comment) throw new Error('Comment not found')
        if (comment.streamId !== streamId)
          throw new Error(
            'Stop hacking - that comment is not part of the specified stream.'
          )
        break
      }
      default:
        throw Error(
          `resource type ${res.resourceType} is not supported as a comment target`
        )
    }
  }

export const deleteCommentFactory =
  (deps: { db: Knex }): DeleteComment =>
  async ({ commentId }) => {
    return !!(await tables.comments(deps.db).where(Comments.col.id, commentId).del())
  }

/**
 * One of `streamId` or `resources` expected. If both are provided, then
 * `resources` takes precedence.
 */
type GetCommentsLegacyParams = {
  limit?: number | null
  cursor?: string | null
  userId?: string | null
  replies?: boolean | null
  archived?: boolean | null
} & (
  | {
      resources: ResourceIdentifier[]
      streamId?: null
    }
  | {
      resources?: ResourceIdentifier[] | null
      streamId: string
    }
)

/**
 * @deprecated Use `getPaginatedProjectComments()` instead
 */
export const getCommentsLegacyFactory =
  (deps: { db: Knex }) =>
  async ({
    resources,
    limit,
    cursor,
    userId = null,
    replies = false,
    streamId,
    archived = false
  }: GetCommentsLegacyParams) => {
    const query = deps.db().with('comms', (cte) => {
      cte.select().distinctOn('id').from('comments')
      cte.join('comment_links', 'comments.id', '=', 'commentId')

      if (userId) {
        // link viewed At
        cte.leftOuterJoin('comment_views', (b) => {
          b.on('comment_views.commentId', '=', 'comments.id')
          b.andOn('comment_views.userId', '=', knex.raw('?', userId))
        })
      }

      if (resources && resources.length !== 0) {
        cte.where((q) => {
          // link resources
          for (const res of resources) {
            q.orWhere('comment_links.resourceId', '=', res.resourceId)
          }
        })
      } else {
        cte.where({ streamId })
      }
      if (!replies) {
        cte.whereNull('parentComment')
      }
      cte.where('archived', '=', archived)
    })

    query.select().from('comms')

    // total count coming from our cte
    query.joinRaw('right join (select count(*) from comms) c(total_count) on true')

    // get comment's all linked resources
    query.joinRaw(`
      join(
        select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
        from comment_links cl
        join comms on comms.id = cl."commentId"
        group by cl."commentId"
      ) res using(id)`)

    if (cursor) {
      query.where('createdAt', '<', cursor)
    }

    limit = clamp(limit ?? 10, 0, 100)
    query.orderBy('createdAt', 'desc')
    query.limit(limit || 1) // need at least 1 row to get totalCount

    const rows = (await query) as Array<
      CommentRecord & {
        total_count: string
        resources: Array<{ resourceId: string; resourceType: string }>
      }
    >
    const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0
    const nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

    return {
      items: !limit ? [] : rows,
      cursor: nextCursor ? nextCursor.toISOString() : null,
      totalCount
    }
  }

export const getResourceCommentCountFactory =
  (deps: { db: Knex }) =>
  async ({ resourceId }: { resourceId: string }) => {
    const [res] = await tables
      .commentLinks(deps.db)
      .count('commentId')
      .where({ resourceId })
      .join('comments', 'comments.id', '=', 'commentId')
      .where('comments.archived', '=', false)

    if (res && res.count) {
      return parseInt(String(res.count))
    }
    return 0
  }
