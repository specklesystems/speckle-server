import {
  CommentLinkRecord,
  CommentRecord,
  CommentLinkResourceType,
  CommentViewRecord,
  ExtendedComment
} from '@/modules/comments/domain/types'
import {
  BranchCommits,
  Branches,
  CommentLinks,
  Comments,
  CommentViews,
  Commits,
  knex
} from '@/modules/core/dbSchema'
import {
  ResourceIdentifier,
  ResourceType
} from '@/modules/core/graph/generated/graphql'
import {
  MarkNullableOptional,
  Optional
} from '@/modules/shared/helpers/typeHelper'
import { clamp, keyBy, reduce } from 'lodash'
import crs from 'crypto-random-string'
import {
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { SpeckleViewer } from '@speckle/shared'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'
import { DeleteComment, GetBatchedStreamComments, GetBranchCommentCounts, GetComment, GetCommentLinks, GetCommentParents, GetCommentReplyAuthorIds, GetCommentReplyCounts, GetComments, GetCommentsResources, GetCommentsViewedAt, GetCommitCommentCounts, GetPaginatedBranchComments, GetPaginatedBranchCommentsTotalCount, GetPaginatedCommitComments, GetPaginatedCommitCommentsTotalCount, GetPaginatedProjectComments, GetPaginatedProjectCommentsTotalCount, GetResourceCommentCount, GetStreamCommentCount, GetStreamCommentCounts, InsertComment, InsertCommentLinks, InsertComments, LegacyGetComment, MarkCommentUpdated, MarkCommentViewed, UpdateComment } from '@/modules/comments/domain/operations'

export const generateCommentId = () => crs({ length: 10 })

const tables = {
  branches: (db: Knex) => db<BranchRecord>(Branches.name),
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  comments: <T extends CommentRecord | CommentRecord[] = CommentRecord>(db: Knex) => db<T>(Comments.name),
  commentLinks: (db: Knex) => db<CommentLinkRecord>(CommentLinks.name),
  commentViews: (db: Knex) => db<CommentViewRecord>(CommentViews.name)
}

/**
 * Get a single comment
 */
export const getCommentFactory =
  ({ db }: { db: Knex }): GetComment =>
    async ({ id, userId = null }) => {
      const query = tables.comments(db).select('*').joinRaw(`
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

      // TODO: How to get (valid) `.where().first()` chain to change typescript type
      return (await query) as unknown as Optional<ExtendedComment>
    }

/**
 * @deprecated You should probably use `getComment`. This was written to limit logic changes during refactoring.
 */
export const legacyGetCommentFactory =
  ({ db }: { db: Knex }): LegacyGetComment =>
    async ({ id }) => {
      return await tables.comments(db).where({ id }).first()
    }

/**
 * @deprecated Use `getPaginatedProjectComments()` instead
 */
export const getCommentsFactory =
  ({ db }: { db: Knex }): GetComments =>
    async ({
      resources,
      limit,
      cursor,
      userId = null,
      replies = false,
      streamId,
      archived = false
    }) => {
      const query = db.with('comms', (cte) => {
        cte.select().distinctOn('id').from('comments')
        cte.join('comment_links', 'comments.id', '=', 'commentId')

        if (userId) {
          // link viewed At
          cte.leftOuterJoin('comment_views', (b) => {
            b.on('comment_views.commentId', '=', 'comments.id')
            b.andOn('comment_views.userId', '=', db.raw('?', userId))
          })
        }

        if (resources && resources.length !== 0) {
          cte.where((q) => {
            // link resources
            for (const res of resources) {
              q.orWhere('comment_links.resourceId', '=', res!.resourceId)
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

      const rows = await query
      const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0
      const nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

      return {
        items: !limit ? [] : rows,
        cursor: nextCursor ? nextCursor.toISOString() : null,
        totalCount
      }
    }

/**
 * Get resources array for the specified comments. Results object is keyed by comment ID.
 */
export const getCommentsResourcesFactory =
  ({ db }: { db: Knex }): GetCommentsResources =>
    async ({ commentIds }) => {
      if (!commentIds.length) return {}

      const q = tables.commentLinks(db)
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

export const getCommentsViewedAt =
  ({ db }: { db: Knex }): GetCommentsViewedAt =>
    async ({ commentIds, userId }) => {
      if (!commentIds?.length || !userId) return []

      const q = tables.commentViews(db)
        .where(CommentViews.col.userId, userId)
        .whereIn(CommentViews.col.commentId, commentIds)

      return await q
    }

export const getBatchedStreamCommentsFactory =
  ({ db }: { db: Knex }): GetBatchedStreamComments =>
    ({ streamId, options }) => {
      const { withoutParentCommentOnly = false, withParentCommentOnly = false } =
        options || {}

      const baseQuery = tables.comments<CommentRecord[]>(db)
        .where(Comments.col.streamId, streamId)
        .orderBy(Comments.col.id)

      if (withoutParentCommentOnly) {
        baseQuery.andWhere(Comments.col.parentComment, null)
      } else if (withParentCommentOnly) {
        baseQuery.andWhereNot(Comments.col.parentComment, null)
      }

      // TODO: The type from knex does not agree with the (working) usage at `clone.ts`
      return executeBatchedSelect(baseQuery, options) as unknown as AsyncGenerator<CommentRecord[], void, never>
    }

export const getCommentLinksFactory =
  ({ db }: { db: Knex }): GetCommentLinks =>
    async ({ commentIds, options }) => {
      const q = tables.commentLinks(db)
        .whereIn(
          CommentLinks.col.commentId,
          commentIds
        )

      if (options?.trx) q.transacting(options.trx)

      return await q
    }

export const insertCommentsFactory =
  ({ db }: { db: Knex }): InsertComments =>
    async ({ comments, options }) => {
      const q = tables.comments(db).insert(comments)
      if (options?.trx) q.transacting(options.trx)
      return await q
    }

export const insertCommentLinksFactory =
  ({ db }: { db: Knex }): InsertCommentLinks =>
    async ({ commentLinks, options }) => {
      const q = tables.commentLinks(db).insert(commentLinks)
      if (options?.trx) q.transacting(options.trx)
      return await q
    }


export const getStreamCommentCountsFactory =
  ({ db }: { db: Knex }): GetStreamCommentCounts =>
    async ({ streamIds, options }) => {
      if (!streamIds?.length) return []
      const { threadsOnly, includeArchived } = options || {}
      const q = tables.comments(db)
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
  ({ db }: { db: Knex }): GetCommitCommentCounts =>
    async ({ commitIds, options }) => {
      if (!commitIds?.length) return []
      const { threadsOnly, includeArchived } = options || {}

      const q = tables.commentLinks(db)
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
  ({ db }: { db: Knex }): GetStreamCommentCount =>
    async ({ streamId, options }) => {
      const [res] = await getStreamCommentCountsFactory({ db })({ streamIds: [streamId], options })
      return res?.count || 0
    }

export const getBranchCommentCountsFactory =
  ({ db }: { db: Knex }): GetBranchCommentCounts =>
    async ({ branchIds, options }) => {
      if (!branchIds.length) return []
      const { threadsOnly, includeArchived } = options || {}

      const q = tables.branches(db)
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
  ({ db }: { db: Knex }): GetCommentReplyCounts =>
    async ({ threadIds, options }) => {
      if (!threadIds.length) return []
      const { includeArchived } = options || {}

      const q = tables.comments(db)
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
  ({ db }: { db: Knex }): GetCommentReplyAuthorIds =>
    async ({ threadIds, options }) => {
      if (!threadIds.length) return {}
      const { includeArchived } = options || {}

      const q = tables.comments(db)
        .select([Comments.col.parentComment, Comments.col.authorId])
        .whereIn(Comments.col.parentComment, threadIds)
        .groupBy(Comments.col.parentComment, Comments.col.authorId)

      if (!includeArchived) {
        q.andWhere(Comments.col.archived, false)
      }

      // TODO: I don't think this type is strictly correct? (groupBy?)
      const results = (await q) as unknown as { parentComment: string; authorId: string }[]
      return reduce(
        results,
        (result, item) => {
          ; (result[item.parentComment] || (result[item.parentComment] = [])).push(
            item.authorId
          )
          return result
        },
        {} as Record<string, string[]>
      )
    }

// Internal
const getPaginatedCommitCommentsBaseQuery = <T = CommentRecord[]>({ db }: { db: Knex }) =>
  (params: Omit<Parameters<GetPaginatedCommitComments>[0], 'limit' | 'cursor'>) => {
    const { commitId, filter } = params

    const q = tables.commits(db)
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

export const getPaginatedCommitCommentsFactory =
  ({ db }: { db: Knex }): GetPaginatedCommitComments =>
    async (params) => {
      const { cursor } = params

      const limit = clamp(params.limit, 0, 100)
      if (!limit) return { items: [], cursor: null }

      const q = getPaginatedCommitCommentsBaseQuery({ db })(params)
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
          : null,
      }
    }

export const getPaginatedCommitCommentsTotalCountFactory =
  ({ db }: { db: Knex }): GetPaginatedCommitCommentsTotalCount =>
    async (params) => {
      const baseQ = getPaginatedCommitCommentsBaseQuery({ db })(params)
      const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
      const [row] = await q

      return parseInt(row.count || '0')
    }

// Internal
const getPaginatedBranchCommentsBaseQuery = ({ db }: { db: Knex }) =>
  (params: Omit<Parameters<GetPaginatedBranchComments>[0], 'limit' | 'cursor'>) => {
    const { branchId, filter } = params

    const q = tables.branches(db)
      .distinct()
      .select(Comments.cols)
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

export const getPaginatedBranchCommentsFactory =
  ({ db }: { db: Knex }): GetPaginatedBranchComments =>
    async (params) => {
      const { cursor } = params

      const limit = clamp(params.limit, 0, 100)
      if (!limit) return { items: [], cursor: null }

      const q = getPaginatedBranchCommentsBaseQuery({ db })(params)
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
          : null,
      }
    }

export const getPaginatedBranchCommentsTotalCountFactory =
  ({ db }: { db: Knex }): GetPaginatedBranchCommentsTotalCount =>
    async (params) => {
      const baseQ = getPaginatedBranchCommentsBaseQuery({ db })(params)
      const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
      const [row] = await q

      return parseInt(row.count || '0')
    }

/**
 * Used exclusively in paginated project comment retrieval to resolve latest commit IDs for
 * model resource identifiers that just target latest (no versionId specified). This is required
 * when we only wish to load comment threads for loaded resources.
 */
const resolvePaginatedProjectCommentsLatestModelResources = async (
  resourceIdString: string | null | undefined
) => {
  if (!resourceIdString?.length) return []
  const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(resourceIdString)
  const modelResources = resources.filter(SpeckleViewer.ViewerRoute.isModelResource)
  if (!modelResources.length) return []

  const latestModelResources = modelResources.filter((r) => !r.versionId)
  if (!latestModelResources.length) return []

  return await getBranchLatestCommits(latestModelResources.map((r) => r.modelId))
}

// Internal
const getPaginatedProjectCommentsBaseQuery =
  ({ db }: { db: Knex }) => async (
    params: Omit<Parameters<GetPaginatedProjectComments>[0], 'limit' | 'cursor'>,
    options?: {
      preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
    }
  ) => {
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

    const q = tables.comments(db).distinct().select(Comments.cols)

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

export const getPaginatedProjectCommentsFactory =
  ({ db }: { db: Knex }): GetPaginatedProjectComments =>
    async (params, options) => {
      const { cursor } = params
      const limit = clamp(params.limit, 0, 100)
      if (!limit) return { items: [], cursor: null }

      const { baseQuery } = await getPaginatedProjectCommentsBaseQuery({ db })(params, options)
      const q = baseQuery.orderBy(Comments.col.createdAt, 'desc').limit(limit)

      if (cursor) {
        q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
      }

      const items = await q
      return {
        items,
        cursor: items.length
          ? encodeCursor(items[items.length - 1].createdAt.toISOString())
          : null,
      }
    }

export const getPaginatedProjectCommentsTotalCountFactory =
  ({ db }: { db: Knex }): GetPaginatedProjectCommentsTotalCount =>
    async (params, options) => {
      const { baseQuery } = await getPaginatedProjectCommentsBaseQuery({ db })(params, options)
      const q = knex.count<{ count: string }[]>().from(baseQuery.as('sq1'))
      const [row] = await q

      return parseInt(row.count || '0')
    }

export const getResourceCommentCountFactory =
  ({ db }: { db: Knex }): GetResourceCommentCount =>
    async ({ resourceId }) => {
      const [res] = await tables.commentLinks(db)
        .count('commentId')
        .where({ resourceId })
        .join('comments', 'comments.id', '=', 'commentId')
        .where('comments.archived', '=', false)

      if (res && res.count) {
        return typeof res.count === 'number' ? res.count : parseInt(res.count)
      }

      return 0
    }

export const getCommentParentsFactory =
  ({ db }: { db: Knex }): GetCommentParents =>
    async ({ replyIds }) => {
      const q = tables.comments(db)
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
  ({ db }: { db: Knex }): MarkCommentViewed =>
    async ({ commentId, userId }) => {
      const query = tables.commentViews(db)
        .insert({ commentId, userId, viewedAt: knex.fn.now() })
        .onConflict(knex.raw('("commentId","userId")'))
        .merge()
      return await query
    }

export type InsertCommentPayload = MarkNullableOptional<
  Omit<CommentRecord, 'id' | 'createdAt' | 'updatedAt' | 'text' | 'archived'> & {
    text: SmartTextEditorValueSchema
    archived?: boolean
  }
>

export const insertCommentFactory =
  ({ db }: { db: Knex }): InsertComment =>
    async (input, options): Promise<CommentRecord> => {
      const finalInput = { ...input, id: generateCommentId() }
      // TODO: The type of `text` in `InsertCommentPayload` appears to be incorrect
      const q = tables.comments(db).insert(finalInput as unknown as CommentRecord, '*')
      if (options?.trx) q.transacting(options.trx)

      const [res] = await q
      return res as CommentRecord
    }

export const markCommentUpdatedFactory =
  ({ db }: { db: Knex }): MarkCommentUpdated =>
    async ({ commentId }) => {
      return await tables.comments(db)
        .where(Comments.col.id, commentId)
        .update({
          [Comments.withoutTablePrefix.col.updatedAt]: new Date()
        })
    }

export const updateCommentFactory =
  ({ db }: { db: Knex }): UpdateComment =>
    async ({ id, input }) => {
      // TODO: The type of `text` in `InsertCommentPayload` appears to be incorrect
      const [res] = await tables.comments(db).where(Comments.col.id, id).update(input as unknown as CommentRecord, '*')
      return res as CommentRecord
    }

export const deleteCommentFactory =
  ({ db }: { db: Knex }): DeleteComment =>
    async ({ commentId }) => {
      await tables.comments(db).where({ id: commentId }).delete()
    }
