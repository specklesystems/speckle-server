import { ensureError, SpeckleViewer } from '@speckle/shared'
import type {
  CreateCommentReplyInput,
  EditCommentInput
} from '@/modules/core/graph/generated/graphql'
import { CommentCreateError, CommentUpdateError } from '@/modules/comments/errors'
import { buildCommentTextFromInput } from '@/modules/comments/services/commentTextService'
import type {
  CommentLinkRecord,
  CommentLinkResourceType,
  CommentRecord
} from '@/modules/comments/helpers/types'
import {
  formatSerializedViewerState,
  inputToDataStruct
} from '@/modules/comments/services/data'
import type {
  ArchiveCommentAndNotify,
  CreateCommentReplyAndNotify,
  CreateCommentThreadAndNotify,
  EditCommentAndNotify,
  GetComment,
  GetViewerResourcesForComment,
  InsertCommentLinks,
  InsertCommentPayload,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  UpdateComment,
  ValidateInputAttachments
} from '@/modules/comments/domain/operations'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { CommentEvents } from '@/modules/comments/domain/events'
import type { GetViewerResourceItemsUngrouped } from '@/modules/viewer/domain/operations/resources'

export const createCommentThreadAndNotifyFactory =
  (deps: {
    getViewerResourceItemsUngrouped: GetViewerResourceItemsUngrouped
    validateInputAttachments: ValidateInputAttachments
    insertComments: InsertComments
    insertCommentLinks: InsertCommentLinks
    markCommentViewed: MarkCommentViewed
    emitEvent: EventBusEmit
  }): CreateCommentThreadAndNotify =>
  async (input, userId, options) => {
    const [resources] = await Promise.all([
      deps.getViewerResourceItemsUngrouped({ ...input, loadedVersionsOnly: true }),
      deps.validateInputAttachments(input.projectId, input.content.blobIds || [])
    ])
    if (!resources.length) {
      throw new CommentCreateError(
        "Resource ID string doesn't resolve to any valid resources for the specified project/stream"
      )
    }

    const state = SpeckleViewer.ViewerState.isSerializedViewerState(input.viewerState)
      ? formatSerializedViewerState(input.viewerState)
      : null
    const dataStruct = inputToDataStruct(state)

    const commentPayload: InsertCommentPayload = {
      streamId: input.projectId,
      authorId: userId,
      text: buildCommentTextFromInput({
        doc: input.content.doc,
        blobIds: input.content.blobIds || undefined
      }),
      screenshot: input.screenshot,
      data: dataStruct,
      ...(options?.createdAt
        ? { createdAt: options.createdAt, updatedAt: options.createdAt }
        : {})
    }

    let comment: CommentRecord
    try {
      // i know we're loosing transactional consistency...
      // it can be added back with the commandFactory on top of a service
      const [insertedComment] = await deps.insertComments([commentPayload])

      const links: CommentLinkRecord[] = resources.map((r) => {
        let resourceId = r.objectId
        let resourceType: CommentLinkResourceType = 'object'
        if (r.versionId) {
          resourceId = r.versionId
          resourceType = 'commit'
        }

        return {
          commentId: insertedComment.id,
          resourceId,
          resourceType
        }
      })
      await deps.insertCommentLinks(links)

      comment = insertedComment
    } catch (e) {
      throw new CommentCreateError('Comment creation failed', { cause: ensureError(e) })
    }

    // Mark as viewed and emit events
    await Promise.all([
      deps.markCommentViewed(comment.id, userId),
      deps.emitEvent({
        eventName: CommentEvents.Created,
        payload: {
          comment,
          input,
          isThread: true,
          resourceItems: resources
        }
      })
    ])

    return comment
  }

export const createCommentReplyAndNotifyFactory =
  (deps: {
    getComment: GetComment
    validateInputAttachments: ValidateInputAttachments
    insertComments: InsertComments
    insertCommentLinks: InsertCommentLinks
    markCommentUpdated: MarkCommentUpdated
    emitEvent: EventBusEmit
    getViewerResourcesForComment: GetViewerResourcesForComment
  }): CreateCommentReplyAndNotify =>
  async (input: CreateCommentReplyInput, userId: string) => {
    const thread = await deps.getComment({ id: input.threadId, userId })
    if (!thread) {
      throw new CommentCreateError('Reply creation failed due to nonexistant thread')
    }
    await deps.validateInputAttachments(thread.streamId, input.content.blobIds || [])

    const commentPayload: InsertCommentPayload = {
      streamId: thread.streamId,
      authorId: userId,
      text: buildCommentTextFromInput({
        doc: input.content.doc,
        blobIds: input.content.blobIds || undefined
      }),
      parentComment: thread.id,
      data: null
    }

    let reply: CommentRecord
    try {
      const [insertedReply] = await deps.insertComments([commentPayload])
      const links: CommentLinkRecord[] = [
        { resourceType: 'comment', resourceId: thread.id, commentId: insertedReply.id }
      ]
      await deps.insertCommentLinks(links)

      reply = insertedReply
    } catch (e) {
      throw new CommentCreateError('Reply creation failed', { cause: ensureError(e) })
    }

    // Mark parent comment updated and emit events
    const resourceItems = await deps.getViewerResourcesForComment(
      reply.streamId,
      reply.id
    )
    await Promise.all([
      deps.markCommentUpdated(thread.id),
      deps.emitEvent({
        eventName: CommentEvents.Created,
        payload: {
          comment: reply,
          input,
          isThread: false,
          resourceItems
        }
      })
    ])

    return reply
  }

export const editCommentAndNotifyFactory =
  (deps: {
    getComment: GetComment
    validateInputAttachments: ValidateInputAttachments
    updateComment: UpdateComment
    emitEvent: EventBusEmit
  }): EditCommentAndNotify =>
  async (input: EditCommentInput, userId: string) => {
    const comment = await deps.getComment({ id: input.commentId, userId })
    if (!comment) {
      throw new CommentUpdateError('Comment update failed due to nonexistant comment')
    }
    if (comment.authorId !== userId) {
      throw new CommentUpdateError("You cannot edit someone else's comments")
    }

    await deps.validateInputAttachments(comment.streamId, input.content.blobIds || [])
    const updatedComment = await deps.updateComment(comment.id, {
      text: buildCommentTextFromInput({
        doc: input.content.doc,
        blobIds: input.content.blobIds || undefined
      })
    })

    await deps.emitEvent({
      eventName: CommentEvents.Updated,
      payload: {
        previousComment: comment,
        newComment: updatedComment!
      }
    })

    return updatedComment
  }

export const archiveCommentAndNotifyFactory =
  (deps: {
    getComment: GetComment
    getStream: GetStream
    updateComment: UpdateComment
    emitEvent: EventBusEmit
    getViewerResourcesForComment: GetViewerResourcesForComment
  }): ArchiveCommentAndNotify =>
  async (commentId: string, userId: string, archived = true) => {
    const comment = await deps.getComment({ id: commentId, userId })
    if (!comment) {
      throw new CommentUpdateError(
        "Specified comment doesn't exist and thus it's archival status can't be changed"
      )
    }

    const stream = await deps.getStream({ streamId: comment.streamId, userId })
    if (!stream) {
      throw new CommentUpdateError(
        'You do not have permissions to archive this comment'
      )
    }
    const updatedComment = await deps.updateComment(comment.id, {
      archived
    })

    await deps.emitEvent({
      eventName: CommentEvents.Archived,
      payload: {
        userId,
        input: { archived, commentId, streamId: stream.id },
        comment: updatedComment!
      }
    })

    return updatedComment
  }

export const markCommentViewedFactory =
  (deps: {
    markCommentViewed: MarkCommentViewed
    emitEvent: EventBusEmit
  }): MarkCommentViewed =>
  async (commentId: string, userId: string) => {
    const updated = await deps.markCommentViewed(commentId, userId)
    await deps.emitEvent({
      eventName: CommentEvents.Viewed,
      payload: {
        commentId,
        userId
      }
    })

    return updated
  }
