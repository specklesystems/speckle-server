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
  knex
} from '@/modules/core/dbSchema'
import {
  ResourceIdentifier,
  ResourceType
} from '@/modules/core/graph/generated/graphql'
import {
  MarkNullableOptional,
  MaybeNullOrUndefined,
  Optional
} from '@/modules/shared/helpers/typeHelper'
import { clamp, keyBy, reduce } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import { SpeckleViewer } from '@speckle/shared'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { Merge } from 'type-fest'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'

export const generateCommentId = () => crs({ length: 10 })

export type ExtendedComment = CommentRecord & {
  /**
   * comment_links resources for the comment
   */
  resources: Array<Omit<CommentLinkRecord, 'commentId'>>

  /**
   * If userId was specified, this will contain the last time the user
   * viewed this comment
   */
  viewedAt?: Date
}

const tables = {
  branches: (db: Knex) => db<BranchRecord>(Branches.name),
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  comments: (db: Knex) => db<CommentRecord>(Comments.name),
  commentLinks: (db: Knex) => db<CommentLinkRecord>(CommentLinks.name),
  commentViews: (db: Knex) => db<CommentViewRecord>(CommentViews.name)
}

/**
 * Get a single comment
 */
const getComment = ({ db }: { db: Knex }) =>
  async (params: { id: string; userId?: string }) => {
    const { id, userId = null } = params

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
 * Get resources array for the specified comments. Results object is keyed by comment ID.
 */
const getCommentsResources = ({ db }: { db: Knex }) =>
  async (commentIds: string[]) => {
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

const getCommentsViewedAt = ({ db }: { db: Knex }) =>
  async (commentIds: string[], userId: string) => {
    if (!commentIds?.length || !userId) return []

    const q = tables.commentViews(db)
      .where(CommentViews.col.userId, userId)
      .whereIn(CommentViews.col.commentId, commentIds)

    return await q
  }

type GetBatchedStreamCommentsOptions = BatchedSelectOptions & {
  /**
   * Filter out comments with parent comment references
   * Defaults to: false
   */
  withoutParentCommentOnly: boolean

  /**
   * Filter out comments without parent comment references
   * Defaults to: false
   */
  withParentCommentOnly: boolean
}

const getBatchedStreamComments = ({ db }: { db: Knex }) =>
  async (
    streamId: string,
    options?: Partial<GetBatchedStreamCommentsOptions>
  ) => {
    const { withoutParentCommentOnly = false, withParentCommentOnly = false } =
      options || {}

    const baseQuery = tables.comments(db)
      .where(Comments.col.streamId, streamId)
      .orderBy(Comments.col.id)

    if (withoutParentCommentOnly) {
      baseQuery.andWhere(Comments.col.parentComment, null)
    } else if (withParentCommentOnly) {
      baseQuery.andWhereNot(Comments.col.parentComment, null)
    }

    return executeBatchedSelect(baseQuery, options)
  }

const getCommentLinks = ({ db }: { db: Knex }) =>
  async (
    commentIds: string[],
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const q = tables.commentLinks(db)
      .whereIn(
        CommentLinks.col.commentId,
        commentIds
      )

    if (options?.trx) q.transacting(options.trx)

    return await q
  }

const insertComments = ({ db }: { db: Knex }) =>
  async (
    comments: CommentRecord[],
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const q = tables.comments(db).insert(comments)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

const insertCommentLinks = ({ db }: { db: Knex }) =>
  async (
    commentLinks: CommentLinkRecord[],
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const q = tables.commentLinks(db).insert(commentLinks)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

const getStreamCommentCounts = ({ db }: { db: Knex }) =>
  async (
    streamIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
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

const getCommitCommentCounts = ({ db }: { db: Knex }) =>
  async (
    commitIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
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

const getStreamCommentCount = ({ db }: { db: Knex }) =>
  async (
    streamId: string,
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
    const [res] = await getStreamCommentCounts({ db })([streamId], options)
    return res?.count || 0
  }

const getBranchCommentCounts = ({ db }: { db: Knex }) =>
  async (
    branchIds: string[],
    options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
  ) => {
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

const getCommentReplyCounts = ({ db }: { db: Knex }) =>
  async (
    threadIds: string[],
    options?: Partial<{ includeArchived: boolean }>
  ) => {
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

const getCommentReplyAuthorIds = ({ db }: { db: Knex }) => async (
  threadIds: string[],
  options?: Partial<{ includeArchived: boolean }>
) => {
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

export type PaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

// Internal
const getPaginatedCommitCommentsBaseQuery = <T = CommentRecord[]>({ db }: { db: Knex }) =>
  (params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>) => {
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

const getPaginatedCommitComments = ({ db }: { db: Knex }) =>
  async (params: PaginatedCommitCommentsParams) => {
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
        : null
    }
  }

const getPaginatedCommitCommentsTotalCount =
  ({ db }: { db: Knex }) =>
    async (params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>) => {
      const baseQ = getPaginatedCommitCommentsBaseQuery({ db })(params)
      const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
      const [row] = await q

      return parseInt(row.count || '0')
    }

export type PaginatedBranchCommentsParams = {
  branchId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

// Internal
const getPaginatedBranchCommentsBaseQuery = ({ db }: { db: Knex }) =>
  (params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>) => {
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

const getPaginatedBranchComments = ({ db }: { db: Knex }) =>
  async (params: PaginatedBranchCommentsParams) => {
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
        : null
    }
  }

const getPaginatedBranchCommentsTotalCount = ({ db }: { db: Knex }) => async (
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) => {
  const baseQ = getPaginatedBranchCommentsBaseQuery({ db })(params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}

export type PaginatedProjectCommentsParams = {
  projectId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<
    Partial<{
      threadsOnly: boolean
      includeArchived: boolean
      archivedOnly: boolean
      resourceIdString: string
      /**
       * If true, will ignore the version parts of `model@version` identifiers and look for comments of
       * all versions of any selected comments
       */
      allModelVersions: boolean
    }>
  >
}

// Internal
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
const getPaginatedProjectCommentsBaseQuery = ({ db }: { db: Knex }) => async (
  params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
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

const getPaginatedProjectComments = ({ db }: { db: Knex }) => async (
  params: PaginatedProjectCommentsParams,
  options?: {
    preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
  }
) => {
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
      : null
  }
}

const getPaginatedProjectCommentsTotalCount = ({ db }: { db: Knex }) => async (
  params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
  options?: {
    preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
  }
) => {
  const { baseQuery } = await getPaginatedProjectCommentsBaseQuery({ db })(params, options)
  const q = knex.count<{ count: string }[]>().from(baseQuery.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}

const getCommentParents = ({ db }: { db: Knex }) =>
  async (replyIds: string[]) => {
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

const markCommentViewed = ({ db }: { db: Knex }) =>
  async (commentId: string, userId: string) => {
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

const insertComment = ({ db }: { db: Knex }) => async (
  input: InsertCommentPayload,
  options?: Partial<{ trx: Knex.Transaction }>
): Promise<CommentRecord> => {
  const finalInput = { ...input, id: generateCommentId() }
  // TODO: The type of `text` in `InsertCommentPayload` appears to be incorrect
  const q = tables.comments(db).insert(finalInput as unknown as CommentRecord, '*')
  if (options?.trx) q.transacting(options.trx)

  const [res] = await q
  return res as CommentRecord
}

const markCommentUpdated = ({ db }: { db: Knex }) => async (commentId: string) => {
  return await tables.comments(db)
    .where(Comments.col.id, commentId)
    .update({
      [Comments.withoutTablePrefix.col.updatedAt]: new Date()
    })
}

const updateComment = ({ db }: { db: Knex }) => async (
  id: string,
  input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
) => {
  // TODO: The type of `text` in `InsertCommentPayload` appears to be incorrect
  const [res] = await tables.comments(db).where(Comments.col.id, id).update(input as unknown as CommentRecord, '*')
  return res as CommentRecord
}

export const createCommentsRepository = ({ db }: { db: Knex }) => ({
  getComment: getComment({ db }),
  getCommentsResources: getCommentsResources({ db }),
  getCommentsViewedAt: getCommentsViewedAt({ db }),
  getBatchedStreamComments: getBatchedStreamComments({ db }),
  getCommentLinks: getCommentLinks({ db }),
  insertComments: insertComments({ db }),
  insertCommentLinks: insertCommentLinks({ db }),
  // TODO: Does `getStreamCommentCounts` need to be exported?
  getStreamCommentCounts: getStreamCommentCounts({ db }),
  getCommitCommentCounts: getCommitCommentCounts({ db }),
  getStreamCommentCount: getStreamCommentCount({ db }),
  getBranchCommentCounts: getBranchCommentCounts({ db }),
  getCommentReplyCounts: getCommentReplyCounts({ db }),
  getCommentReplyAuthorIds: getCommentReplyAuthorIds({ db }),
  getPaginatedCommitComments: getPaginatedCommitComments({ db }),
  getPaginatedCommitCommentsTotalCount: getPaginatedCommitCommentsTotalCount({ db }),
  getPaginatedBranchComments: getPaginatedBranchComments({ db }),
  getPaginatedBranchCommentsTotalCount: getPaginatedBranchCommentsTotalCount({ db }),
  getPaginatedProjectComments: getPaginatedProjectComments({ db }),
  getPaginatedProjectCommentsTotalCount: getPaginatedProjectCommentsTotalCount({ db }),
  getCommentParents: getCommentParents({ db }),
  markCommentViewed: markCommentViewed({ db }),
  insertComment: insertComment({ db }),
  markCommentUpdated: markCommentUpdated({ db }),
  updateComment: updateComment({ db })
})
