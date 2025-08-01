import crs from 'crypto-random-string'
import { ForbiddenError, ResourceMismatch } from '@/modules/shared/errors'
import { buildCommentTextFromInput } from '@/modules/comments/services/commentTextService'
import { isNonNullable, Roles } from '@speckle/shared'
import type {
  ResourceIdentifier,
  CommentCreateInput,
  CommentEditInput
} from '@/modules/core/graph/generated/graphql'
import type { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import type { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import type {
  CheckStreamResourceAccess,
  CheckStreamResourcesAccess,
  DeleteComment,
  GetComment,
  GetViewerResourcesForComment,
  GetViewerResourcesFromLegacyIdentifiers,
  InsertCommentLinks,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  UpdateComment,
  ValidateInputAttachments
} from '@/modules/comments/domain/operations'
import type { ResourceType } from '@/modules/comments/domain/types'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { CommentEvents } from '@/modules/comments/domain/events'
import type { JSONContent } from '@tiptap/core'
import { UserInputError } from '@/modules/core/errors/userinput'
import { CommentNotFoundError } from '@/modules/comments/errors'

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
    emitEvent: EventBusEmit
    getViewerResourcesFromLegacyIdentifiers: GetViewerResourcesFromLegacyIdentifiers
  }) =>
  async (
    { userId, input }: { userId: string; input: CommentCreateInput },
    options?: Partial<{
      /**
       * Used in tests to skip text validation & formatting - text is saved in DB as is
       */
      skipTextValidation: boolean
    }>
  ) => {
    if (input.resources.length < 1)
      throw new UserInputError(
        'Must specify at least one resource as the comment target'
      )

    const commentResource = input.resources.find((r) => r?.resourceType === 'comment')
    if (commentResource)
      throw new UserInputError('Please use the comment reply mutation.')

    // Stream checks
    const streamResources = input.resources.filter((r) => r?.resourceType === 'stream')
    if (streamResources.length > 1)
      throw new UserInputError('Commenting on multiple streams is not supported')

    const [stream] = streamResources
    if (stream && stream.resourceId !== input.streamId)
      throw new ResourceMismatch(
        "Input streamId doesn't match the stream resource.resourceId"
      )

    const comment = {
      streamId: input.streamId,
      text: input.text as SmartTextEditorValueSchema,
      data: input.data,
      screenshot: input.screenshot ?? null
    }

    await deps.validateInputAttachments(input.streamId, input.blobIds)
    comment.text = options?.skipTextValidation
      ? (input.text as SmartTextEditorValueSchema)
      : buildCommentTextFromInput({
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

    const resourceItems = await deps.getViewerResourcesFromLegacyIdentifiers(
      input.streamId,
      input.resources.filter(isNonNullable)
    )
    await deps.emitEvent({
      eventName: CommentEvents.Created,
      payload: {
        comment: newComment,
        input,
        isThread: true,
        resourceItems
      }
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
    emitEvent: EventBusEmit
    getViewerResourcesForComment: GetViewerResourcesForComment
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
    text: JSONContent
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

    const resourceItems = await deps.getViewerResourcesForComment(
      newComment.streamId,
      newComment.id
    )
    await deps.emitEvent({
      eventName: CommentEvents.Created,
      payload: {
        comment: newComment,
        isThread: false,
        input: {
          threadId: parentCommentId,
          projectId: streamId,
          content: {
            blobIds,
            doc: text
          }
        },
        resourceItems
      }
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
    emitEvent: EventBusEmit
  }) =>
  async ({
    userId,
    input,
    matchUser = false
  }: {
    userId: string
    input: CommentEditInput
    matchUser?: boolean
  }) => {
    const editedComment = await deps.getComment({ id: input.id })
    if (!editedComment) throw new CommentNotFoundError("The comment doesn't exist")

    if (matchUser && editedComment.authorId !== userId)
      throw new ForbiddenError("You cannot edit someone else's comments")

    await deps.validateInputAttachments(input.streamId, input.blobIds)
    const newText = buildCommentTextFromInput({
      doc: input.text,
      blobIds: input.blobIds
    })
    const updatedComment = await deps.updateComment(input.id, { text: newText })

    await deps.emitEvent({
      eventName: CommentEvents.Updated,
      payload: {
        previousComment: editedComment,
        newComment: updatedComment!
      }
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
    emitEvent: EventBusEmit
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
      throw new CommentNotFoundError(
        `No comment ${commentId} exists, cannot change its archival status`
      )

    const streamWithRole = await deps.getStream({ streamId, userId })

    if (comment.authorId !== userId) {
      if (!streamWithRole || streamWithRole.role !== Roles.Stream.Owner)
        throw new ForbiddenError("You don't have permission to archive the comment")
    }

    const updatedComment = await deps.updateComment(commentId, { archived })

    await deps.emitEvent({
      eventName: CommentEvents.Archived,
      payload: {
        userId,
        input: { archived, commentId, streamId },
        comment: updatedComment!
      }
    })

    return updatedComment!
  }
