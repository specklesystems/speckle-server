'use strict'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import { ForbiddenError } from '@/modules/shared/errors'
import {
  buildCommentTextFromInput,
  validateInputAttachments
} from '@/modules/comments/services/commentTextService'
import { CommentsEmitter, CommentsEvents } from '@/modules/comments/events/emitter'
import {
  getComment as repoGetComment,
  getStreamCommentCount as repoGetStreamCommentCount,
  markCommentViewed
} from '@/modules/comments/repositories/comments'
import { clamp } from 'lodash'
import { Roles } from '@speckle/shared'
import { ResourceIdentifier } from '@/test/graphql/generated/graphql'
import {
  CommentCreateInput,
  CommentEditInput,
  SmartTextEditorValue
} from '@/modules/core/graph/generated/graphql'
import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'

const Comments = () => knex<CommentRecord>('comments')
const CommentLinks = () => knex<CommentLinkRecord>('comment_links')

const resourceCheck = async (res: ResourceIdentifier, streamId: string) => {
  // The switch of doom: if something throws, we're out
  switch (res.resourceType) {
    case 'stream':
      // Stream validity is already checked, so we can just go ahead.
      break
    case 'commit': {
      const linkage = await knex('stream_commits')
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
      const obj = await knex('objects')
        .select()
        .where({ id: res.resourceId, streamId })
        .first()
      if (!obj) throw new Error('Object not found')
      break
    }
    case 'comment': {
      const comment = await Comments().where({ id: res.resourceId }).first()
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


export async function streamResourceCheck({
  streamId,
  resources
}: {
  streamId: string
  resources: ResourceIdentifier[]
}) {
  // this itches - a for loop with queries... but okay let's hit the road now
  await Promise.all(resources.map((res) => resourceCheck(res, streamId)))
}

/**
 * @deprecated Use 'createCommentThreadAndNotify()' instead
 */
export async function createComment({
  userId,
  input
}: {
  userId: string
  input: CommentCreateInput
}) {
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

  const comment: Partial<CommentRecord> = {
    streamId: input.streamId,
    text: input.text as SmartTextEditorValue,
    data: input.data,
    screenshot: input.screenshot ?? null
  }

  comment.id = crs({ length: 10 })
  comment.authorId = userId

  await validateInputAttachments(input.streamId, input.blobIds)
  comment.text = buildCommentTextFromInput({
    doc: input.text,
    blobIds: input.blobIds
  }) as unknown as string

  const [newComment] = await Comments().insert(comment, '*')
  try {
    await module.exports.streamResourceCheck({
      streamId: input.streamId,
      resources: input.resources
    })
    for (const res of input.resources) {
      if (!res) continue
      await CommentLinks().insert({
        commentId: comment.id,
        resourceId: res.resourceId,
        resourceType: res.resourceType
      })
    }
  } catch (e) {
    await Comments().where({ id: comment.id }).delete() // roll back
    throw e // pass on to resolver
  }
  await module.exports.viewComment({ userId, commentId: comment.id }) // so we don't self mark a comment as unread the moment it's created

  await CommentsEmitter.emit(CommentsEvents.Created, {
    comment: newComment
  })

  return newComment
}

/**
 * @deprecated Use 'createCommentReplyAndNotify()' instead
 */
export async function createCommentReply({
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
}) {
  await validateInputAttachments(streamId, blobIds)
  const comment = {
    id: crs({ length: 10 }),
    authorId,
    text: buildCommentTextFromInput({ doc: text, blobIds }),
    data,
    streamId,
    parentComment: parentCommentId
  }

  const [newComment] = await Comments().insert(comment, '*')
  try {
    const commentLink: Omit<CommentLinkRecord, 'commentId'> = {
      resourceId: parentCommentId,
      resourceType: 'comment'
    }
    await module.exports.streamResourceCheck({
      streamId,
      resources: [commentLink]
    })
    await CommentLinks().insert({ commentId: comment.id, ...commentLink })
  } catch (e) {
    await Comments().where({ id: comment.id }).delete() // roll back
    throw e // pass on to resolver
  }
  await Comments().where({ id: parentCommentId }).update({ updatedAt: knex.fn.now() })

  await CommentsEmitter.emit(CommentsEvents.Created, {
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

  await validateInputAttachments(input.streamId, input.blobIds)
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
 * @deprecated Use 'markCommentViewed()'
 */
export async function viewComment({ userId, commentId }: { userId: string; commentId: string }) {
  await markCommentViewed(commentId, userId)
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
    throw new Error(
      `No comment ${commentId} exists, cannot change its archival status`
    )

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
}: {
  resources?: ResourceIdentifier[]
  limit?: number
  cursor?: string
  userId: string | null
  replies?: boolean
  streamId: string
  archived?: boolean
}) {
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

