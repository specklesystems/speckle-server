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
import { isNullOrUndefined, SpeckleViewer } from '@speckle/shared'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { Merge } from 'type-fest'
import { getBranchLatestCommits } from '@/modules/core/repositories/branches'

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

/**
 * Get a single comment
 */
export async function getComment(params: { id: string; userId?: string }) {
  const { id, userId = null } = params

  const query = Comments.knex().select('*').joinRaw(`
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
  return (await query) as Optional<ExtendedComment>
}

/**
 * Get resources array for the specified comments. Results object is keyed by comment ID.
 */
export async function getCommentsResources(commentIds: string[]) {
  if (!commentIds.length) return {}

  const q = CommentLinks.knex()
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

export async function getCommentsViewedAt(commentIds: string[], userId: string) {
  if (!commentIds?.length || !userId) return []

  const q = CommentViews.knex<CommentViewRecord[]>()
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

export function getBatchedStreamComments(
  streamId: string,
  options?: Partial<GetBatchedStreamCommentsOptions>
) {
  const { withoutParentCommentOnly = false, withParentCommentOnly = false } =
    options || {}

  const baseQuery = Comments.knex<CommentRecord[]>()
    .where(Comments.col.streamId, streamId)
    .orderBy(Comments.col.id)

  if (withoutParentCommentOnly) {
    baseQuery.andWhere(Comments.col.parentComment, null)
  } else if (withParentCommentOnly) {
    baseQuery.andWhereNot(Comments.col.parentComment, null)
  }

  return executeBatchedSelect(baseQuery, options)
}

export async function getCommentLinks(
  commentIds: string[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = CommentLinks.knex<CommentLinkRecord[]>().whereIn(
    CommentLinks.col.commentId,
    commentIds
  )

  if (options?.trx) q.transacting(options.trx)

  return await q
}

export async function insertComments(
  comments: CommentRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Comments.knex().insert(comments)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function insertCommentLinks(
  commentLinks: CommentLinkRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = CommentLinks.knex().insert(commentLinks)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function getStreamCommentCounts(
  streamIds: string[],
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  if (!streamIds?.length) return []
  const { threadsOnly, includeArchived } = options || {}
  const q = Comments.knex()
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

export async function getCommitCommentCounts(
  commitIds: string[],
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  if (!commitIds?.length) return []
  const { threadsOnly, includeArchived } = options || {}

  const q = CommentLinks.knex()
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

export async function getStreamCommentCount(
  streamId: string,
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  const [res] = await getStreamCommentCounts([streamId], options)
  return res?.count || 0
}

export async function getBranchCommentCounts(
  branchIds: string[],
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  if (!branchIds.length) return []
  const { threadsOnly, includeArchived } = options || {}

  const q = Branches.knex()
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

export async function getCommentReplyCounts(
  threadIds: string[],
  options?: Partial<{ includeArchived: boolean }>
) {
  if (!threadIds.length) return []
  const { includeArchived } = options || {}

  const q = Comments.knex()
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

export async function getCommentReplyAuthorIds(
  threadIds: string[],
  options?: Partial<{ includeArchived: boolean }>
) {
  if (!threadIds.length) return {}
  const { includeArchived } = options || {}

  const q = Comments.knex()
    .select([Comments.col.parentComment, Comments.col.authorId])
    .whereIn(Comments.col.parentComment, threadIds)
    .groupBy(Comments.col.parentComment, Comments.col.authorId)

  if (!includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  const results = (await q) as { parentComment: string; authorId: string }[]
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

export type PaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

function getPaginatedCommitCommentsBaseQuery<T = CommentRecord[]>(
  params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
) {
  const { commitId, filter } = params

  const q = Commits.knex()
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

export async function getPaginatedCommitComments(
  params: PaginatedCommitCommentsParams
) {
  const { cursor } = params

  const limit = clamp(params.limit, 0, 100)
  if (!limit) return { items: [], cursor: null }

  const q = getPaginatedCommitCommentsBaseQuery(params)
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

export async function getPaginatedCommitCommentsTotalCount(
  params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
) {
  const baseQ = getPaginatedCommitCommentsBaseQuery(params)
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

function getPaginatedBranchCommentsBaseQuery(
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) {
  const { branchId, filter } = params

  const q = Branches.knex()
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

export async function getPaginatedBranchComments(
  params: PaginatedBranchCommentsParams
) {
  const { cursor } = params

  const limit = clamp(params.limit, 0, 100)
  if (!limit) return { items: [], cursor: null }

  const q = getPaginatedBranchCommentsBaseQuery(params)
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

export async function getPaginatedBranchCommentsTotalCount(
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) {
  const baseQ = getPaginatedBranchCommentsBaseQuery(params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}

export type PaginatedProjectCommentsParams = {
  projectId: string
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<
    Partial<{
      threadsOnly: boolean | null
      includeArchived: boolean | null
      archivedOnly: boolean | null
      resourceIdString: string | null
      /**
       * If true, will ignore the version parts of `model@version` identifiers and look for comments of
       * all versions of any selected comments
       */
      allModelVersions: boolean | null
    }>
  >
}

/**
 * Used exclusively in paginated project comment retrieval to resolve latest commit IDs for
 * model resource identifiers that just target latest (no versionId specified). This is required
 * when we only wish to load comment threads for loaded resources.
 */
export async function resolvePaginatedProjectCommentsLatestModelResources(
  resourceIdString: string | null | undefined
) {
  if (!resourceIdString?.length) return []
  const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(resourceIdString)
  const modelResources = resources.filter(SpeckleViewer.ViewerRoute.isModelResource)
  if (!modelResources.length) return []

  const latestModelResources = modelResources.filter((r) => !r.versionId)
  if (!latestModelResources.length) return []

  return await getBranchLatestCommits(latestModelResources.map((r) => r.modelId))
}

async function getPaginatedProjectCommentsBaseQuery(
  params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
  options?: {
    preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
  }
) {
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

  const q = Comments.knex<CommentRecord[]>().distinct().select(Comments.cols)

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

export async function getPaginatedProjectComments(
  params: PaginatedProjectCommentsParams,
  options?: {
    preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
  }
) {
  const { cursor } = params

  let limit: Optional<number> = undefined

  // If undefined limit, no limit at all - we need this for the viewer, where we kinda have to show all threads in the 3D space
  if (!isNullOrUndefined(params.limit)) {
    limit = Math.max(0, params.limit || 0)

    // limit=0, return nothing (req probably only interested in totalCount)
    if (!limit) return { items: [], cursor: null }
  }

  const { baseQuery } = await getPaginatedProjectCommentsBaseQuery(params, options)
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

export async function getPaginatedProjectCommentsTotalCount(
  params: Omit<PaginatedProjectCommentsParams, 'limit' | 'cursor'>,
  options?: {
    preloadedModelLatestVersions?: Awaited<ReturnType<typeof getBranchLatestCommits>>
  }
) {
  const { baseQuery } = await getPaginatedProjectCommentsBaseQuery(params, options)
  const q = knex.count<{ count: string }[]>().from(baseQuery.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}

export async function getCommentParents(replyIds: string[]) {
  const q = Comments.knex()
    .select<Array<CommentRecord & { replyId: string }>>([
      knex.raw('?? as "replyId"', [Comments.col.id]),
      knex.raw('"c2".*')
    ])
    .innerJoin(`${Comments.name} as c2`, `c2.id`, Comments.col.parentComment)
    .whereIn(Comments.col.id, replyIds)
    .whereNotNull(Comments.col.parentComment)
  return await q
}

export async function markCommentViewed(commentId: string, userId: string) {
  const query = CommentViews.knex()
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

export async function insertComment(
  input: InsertCommentPayload,
  options?: Partial<{ trx: Knex.Transaction }>
): Promise<CommentRecord> {
  const finalInput = { ...input, id: generateCommentId() }
  const q = Comments.knex().insert(finalInput, '*')
  if (options?.trx) q.transacting(options.trx)

  const [res] = await q
  return res as CommentRecord
}

export async function markCommentUpdated(commentId: string) {
  return await Comments.knex()
    .where(Comments.col.id, commentId)
    .update({
      [Comments.withoutTablePrefix.col.updatedAt]: new Date()
    })
}

export async function updateComment(
  id: string,
  input: Merge<Partial<CommentRecord>, { text?: SmartTextEditorValueSchema }>
) {
  const [res] = await Comments.knex().where(Comments.col.id, id).update(input, '*')
  return res as CommentRecord
}
