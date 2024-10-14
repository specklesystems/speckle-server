import crs from 'crypto-random-string'
import { ForbiddenError } from '@/modules/shared/errors'
import { buildCommentTextFromInput } from '@/modules/comments/services/commentTextService'
import { CommentsEvents, CommentsEventsEmit } from '@/modules/comments/events/emitter'
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
  GetComment,
  InsertCommentLinks,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  UpdateComment,
  ValidateInputAttachments
} from '@/modules/comments/domain/operations'
import { ResourceType } from '@/modules/comments/domain/types'
import { GetStream } from '@/modules/core/domain/streams/operations'

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
export const editCommentFactory =
  (deps: {
    getComment: GetComment
    validateInputAttachments: ValidateInputAttachments
    updateComment: UpdateComment
    commentsEventsEmit: CommentsEventsEmit
  }) =>
  async ({
    userId,
    input,
    matchUser = false
  }: {
    userId: string
    input: CommentEditInput
    matchUser: boolean
  }) => {
    const editedComment = await deps.getComment({ id: input.id })
    if (!editedComment) throw new Error("The comment doesn't exist")

    if (matchUser && editedComment.authorId !== userId)
      throw new ForbiddenError("You cannot edit someone else's comments")

    await deps.validateInputAttachments(input.streamId, input.blobIds)
    const newText = buildCommentTextFromInput({
      doc: input.text,
      blobIds: input.blobIds
    })
    const updatedComment = await deps.updateComment(input.id, { text: newText })

    await deps.commentsEventsEmit(CommentsEvents.Updated, {
      previousComment: editedComment,
      newComment: updatedComment!
    })

    return updatedComment
  }

/**
 * @deprecated Use 'archiveCommentAndNotify()'
 */
export const archiveCommentFactory =
  (deps: {
    getComment: GetComment
    getStream: GetStream
    updateComment: UpdateComment
  }) =>
  async ({
    commentId,
    userId,
    streamId,
    archived = true
  }: {
    commentId: string
    userId: string
    streamId: string
    archived: boolean
  }) => {
    const comment = await deps.getComment({ id: commentId })
    if (!comment)
      throw new Error(
        `No comment ${commentId} exists, cannot change its archival status`
      )

    const streamWithRole = await deps.getStream({ streamId, userId })

    if (comment.authorId !== userId) {
      if (!streamWithRole || streamWithRole.role !== Roles.Stream.Owner)
        throw new ForbiddenError("You don't have permission to archive the comment")
    }

    const updatedComment = await deps.updateComment(commentId, { archived })
    return updatedComment!
  }
