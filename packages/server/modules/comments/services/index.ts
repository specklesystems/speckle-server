import crs from 'crypto-random-string'
import knex, { db } from '@/db/knex'
import { ForbiddenError } from '@/modules/shared/errors'
import {
  buildCommentTextFromInput,
  validateInputAttachmentsFactory
} from '@/modules/comments/services/commentTextService'
import {
  CommentsEmitter,
  CommentsEvents,
  CommentsEventsEmit
} from '@/modules/comments/events/emitter'
import {
  getComment as repoGetComment,
  getStreamCommentCount as repoGetStreamCommentCount
} from '@/modules/comments/repositories/comments'
import { clamp } from 'lodash'
import { isNonNullable, Roles } from '@speckle/shared'
import {
  ResourceIdentifier,
  CommentCreateInput,
  CommentEditInput,
  SmartTextEditorValue
} from '@/modules/core/graph/generated/graphql'
import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import {
  CheckStreamResourceAccess,
  CheckStreamResourcesAccess,
  DeleteComment,
  InsertCommentLinks,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  ValidateInputAttachments
} from '@/modules/comments/domain/operations'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { ResourceType } from '@/modules/comments/domain/types'

const Comments = () => knex<CommentRecord>('comments')
const CommentLinks = () => knex<CommentLinkRecord>('comment_links')

export const streamResourceCheckFactory =
  (deps: {
    checkStreamResourceAccess: CheckStreamResourceAccess
  }): CheckStreamResourcesAccess =>
  async ({
    streamId,
    resources
  }: {
    streamId: string
    resources: ResourceIdentifier[]
  }) => {
    // this itches - a for loop with queries... but okay let's hit the road now
    await Promise.all(
      resources.map((res) => deps.checkStreamResourceAccess(res, streamId))
    )
  }

/**
 * @deprecated Use 'createCommentThreadAndNotify()' instead
 */
export const createCommentFactory =
  (deps: {
    checkStreamResourcesAccess: CheckStreamResourcesAccess
    validateInputAttachments: ValidateInputAttachments
    insertComments: InsertComments
    insertCommentLinks: InsertCommentLinks
    deleteComment: DeleteComment
    markCommentViewed: MarkCommentViewed
    commentsEventsEmit: CommentsEventsEmit
  }) =>
  async ({ userId, input }: { userId: string; input: CommentCreateInput }) => {
    if (input.resources.length < 1)
      throw Error('Must specify at least one resource as the comment target')

    const commentResource = input.resources.find((r) => r?.resourceType === 'comment')
    if (commentResource) throw new Error('Please use the comment reply mutation.')

    // Stream checks
    const streamResources = input.resources.filter((r) => r?.resourceType === 'stream')
    if (streamResources.length > 1)
      throw Error('Commenting on multiple streams is not supported')

    const [stream] = streamResources
    if (stream && stream.resourceId !== input.streamId)
      throw Error("Input streamId doesn't match the stream resource.resourceId")

    const comment = {
      streamId: input.streamId,
      text: input.text as SmartTextEditorValueSchema,
      data: input.data,
      screenshot: input.screenshot ?? null
    }

    await deps.validateInputAttachments(input.streamId, input.blobIds)
    comment.text = buildCommentTextFromInput({
      doc: input.text,
      blobIds: input.blobIds
    })

    const id = crs({ length: 10 })
    const [newComment] = await deps.insertComments([
      {
        ...comment,
        id,
        authorId: userId
      }
    ])
    try {
      await deps.checkStreamResourcesAccess({
        streamId: input.streamId,
        resources: input.resources.filter(isNonNullable)
      })
      for (const res of input.resources) {
        if (!res) continue
        await deps.insertCommentLinks([
          {
            commentId: id,
            resourceId: res.resourceId,
            resourceType: res.resourceType
          }
        ])
      }
    } catch (e) {
      await deps.deleteComment({ commentId: id }) // roll back
      throw e // pass on to resolver
    }

    await deps.markCommentViewed(id, userId) // so we don't self mark a comment as unread the moment it's created

    await deps.commentsEventsEmit(CommentsEvents.Created, {
      comment: newComment
    })

    return newComment
  }

/**
 * @deprecated Use 'createCommentReplyAndNotify()' instead
 */
export const createCommentReplyFactory =
  (deps: {
    validateInputAttachments: ValidateInputAttachments
    insertComments: InsertComments
    insertCommentLinks: InsertCommentLinks
    checkStreamResourcesAccess: CheckStreamResourcesAccess
    deleteComment: DeleteComment
    markCommentUpdated: MarkCommentUpdated
    commentsEventsEmit: CommentsEventsEmit
  }) =>
  async ({
    authorId,
    parentCommentId,
    streamId,
    text,
    data,
    blobIds
  }: {
    authorId: string
    parentCommentId: string
    streamId: string
    text: SmartTextEditorValue
    data: CommentRecord['data']
    blobIds: string[]
  }) => {
    await deps.validateInputAttachments(streamId, blobIds)
    const comment = {
      id: crs({ length: 10 }),
      authorId,
      text: buildCommentTextFromInput({ doc: text, blobIds }),
      data,
      streamId,
      parentComment: parentCommentId
    }

    const [newComment] = await deps.insertComments([comment])
    try {
      const commentLink: CommentLinkRecord = {
        resourceId: parentCommentId,
        resourceType: 'comment',
        commentId: newComment.id
      }
      await deps.checkStreamResourcesAccess({
        streamId,
        resources: [
          {
            resourceType: commentLink.resourceType as ResourceType,
            resourceId: commentLink.resourceId
          }
        ]
      })
      await deps.insertCommentLinks([commentLink])
    } catch (e) {
      await deps.deleteComment({ commentId: comment.id }) // roll back
      throw e // pass on to resolver
    }

    await deps.markCommentUpdated(parentCommentId)

    await deps.commentsEventsEmit(CommentsEvents.Created, {
      comment: newComment
    })

    return newComment
  }

/**
 * @deprecated Use 'editCommentAndNotify()'
 */
export async function editComment({
  userId,
  input,
  matchUser = false
}: {
  userId: string
  input: CommentEditInput
  matchUser: boolean
}) {
  const editedComment = await Comments().where({ id: input.id }).first()
  if (!editedComment) throw new Error("The comment doesn't exist")

  if (matchUser && editedComment.authorId !== userId)
    throw new ForbiddenError("You cannot edit someone else's comments")

  await validateInputAttachmentsFactory({ getBlobs: getBlobsFactory({ db }) })(
    input.streamId,
    input.blobIds
  )
  const newText = buildCommentTextFromInput({
    doc: input.text,
    blobIds: input.blobIds
  })
  const [updatedComment] = await Comments()
    .where({ id: input.id })
    .update({ text: newText }, '*')

  await CommentsEmitter.emit(CommentsEvents.Updated, {
    previousComment: editedComment,
    newComment: updatedComment
  })

  return updatedComment
}

/**
 * @deprecated Use repository method
 */
export const getComment = repoGetComment
/**
 * @deprecated Use 'archiveCommentAndNotify()'
 */
export async function archiveComment({
  commentId,
  userId,
  streamId,
  archived = true
}: {
  commentId: string
  userId: string
  streamId: string
  archived: boolean
}) {
  const comment = await Comments().where({ id: commentId }).first()
  if (!comment)
    throw new Error(`No comment ${commentId} exists, cannot change its archival status`)

  const aclEntry = await knex('stream_acl')
    .select()
    .where({ resourceId: streamId, userId })
    .first()

  if (comment.authorId !== userId) {
    if (!aclEntry || aclEntry.role !== Roles.Stream.Owner)
      throw new ForbiddenError("You don't have permission to archive the comment")
  }

  const [updatedComment] = await Comments()
    .where({ id: commentId })
    .update({ archived }, '*')
  return updatedComment
}

/**
 * One of `streamId` or `resources` expected. If both are provided, then
 * `resources` takes precedence.
 */
type GetCommentsParams = {
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
export async function getComments({
  resources,
  limit,
  cursor,
  userId = null,
  replies = false,
  streamId,
  archived = false
}: GetCommentsParams) {
  const query = knex.with('comms', (cte) => {
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

  const rows = await query
  const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0
  const nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

  return {
    items: !limit ? [] : rows,
    cursor: nextCursor ? nextCursor.toISOString() : null,
    totalCount
  }
}

export async function getResourceCommentCount({ resourceId }: { resourceId: string }) {
  const [res] = await CommentLinks()
    .count('commentId')
    .where({ resourceId })
    .join('comments', 'comments.id', '=', 'commentId')
    .where('comments.archived', '=', false)

  if (res && res.count) {
    return parseInt(String(res.count))
  }
  return 0
}

export async function getStreamCommentCount({ streamId }: { streamId: string }) {
  return (await repoGetStreamCommentCount(streamId, { threadsOnly: true })) || 0
}
