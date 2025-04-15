import { ensureError, Roles, SpeckleViewer } from '@speckle/shared'
import { AuthContext } from '@/modules/shared/authz'
import { ForbiddenError } from '@/modules/shared/errors'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  CreateCommentInput,
  CreateCommentReplyInput,
  EditCommentInput
} from '@/modules/core/graph/generated/graphql'
import { CommentCreateError, CommentUpdateError } from '@/modules/comments/errors'
import { buildCommentTextFromInput } from '@/modules/comments/services/commentTextService'
import {
  CommentLinkRecord,
  CommentLinkResourceType,
  CommentRecord
} from '@/modules/comments/helpers/types'
import {
  formatSerializedViewerState,
  inputToDataStruct
} from '@/modules/comments/services/data'
import {
  ArchiveCommentAndNotify,
  CreateCommentReplyAndNotify,
  CreateCommentThreadAndNotify,
  EditCommentAndNotify,
  GetComment,
  GetViewerResourceItemsUngrouped,
  GetViewerResourcesForComment,
  InsertCommentLinks,
  InsertCommentPayload,
  InsertComments,
  MarkCommentUpdated,
  MarkCommentViewed,
  UpdateComment,
  ValidateInputAttachments
} from '@/modules/comments/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { CommentEvents } from '@/modules/comments/domain/events'
import { authorizeResolver } from '@/modules/shared'

type AuthorizeProjectCommentsAccessDeps = {
  getStream: GetStream
  adminOverrideEnabled: boolean
}

export const authorizeProjectCommentsAccessFactory =
  (deps: AuthorizeProjectCommentsAccessDeps) =>
  async (params: {
    projectId: string
    authCtx: AuthContext
    requireProjectRole?: boolean
  }) => {
    const { projectId, authCtx, requireProjectRole } = params
    if (authCtx.role === Roles.Server.ArchivedUser) {
      throw new ForbiddenError('You are not authorized')
    }

    const project = await deps.getStream({
      streamId: projectId,
      userId: authCtx.userId
    })
    if (!project) {
      throw new StreamInvalidAccessError('Stream not found')
    }

    let success = true
    if (!project.isPublic && !authCtx.auth) success = false
    if (!project.isPublic && !project.role) success = false
    if (requireProjectRole && !project.role && !project.allowPublicComments)
      success = false
    if (deps.adminOverrideEnabled && authCtx.role === Roles.Server.Admin) success = true

    // TODO: Until we do canCommentCreate & canCommentRead, fallback:
    if (authCtx.userId && (!requireProjectRole || project.allowPublicComments)) {
      try {
        await authorizeResolver(authCtx.userId, projectId, Roles.Stream.Reviewer, null)
        success = true
      } catch {
        // suppress
      }
    }

    if (!success) {
      throw new StreamInvalidAccessError('You are not authorized')
    }

    return project
  }

export const createCommentThreadAndNotifyFactory =
  (deps: {
    getViewerResourceItemsUngrouped: GetViewerResourceItemsUngrouped
    validateInputAttachments: ValidateInputAttachments
    insertComments: InsertComments
    insertCommentLinks: InsertCommentLinks
    markCommentViewed: MarkCommentViewed
    emitEvent: EventBusEmit
  }): CreateCommentThreadAndNotify =>
  async (input: CreateCommentInput, userId: string) => {
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
      data: dataStruct
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
