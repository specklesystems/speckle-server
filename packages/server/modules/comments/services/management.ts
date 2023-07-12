import { ensureError, Roles, SpeckleViewer } from '@speckle/shared'
import { AuthContext } from '@/modules/shared/authz'
import { ForbiddenError } from '@/modules/shared/errors'
import { getStream } from '@/modules/core/repositories/streams'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  InsertCommentPayload,
  getComment,
  markCommentViewed,
  insertComment,
  insertCommentLinks,
  markCommentUpdated,
  updateComment
} from '@/modules/comments/repositories/comments'
import {
  CreateCommentInput,
  CreateCommentReplyInput,
  EditCommentInput
} from '@/modules/core/graph/generated/graphql'
import { getViewerResourceItemsUngrouped } from '@/modules/core/services/commit/viewerResources'
import { CommentCreateError, CommentUpdateError } from '@/modules/comments/errors'
import {
  buildCommentTextFromInput,
  validateInputAttachments
} from '@/modules/comments/services/commentTextService'
import { knex } from '@/modules/core/dbSchema'
import {
  CommentLinkRecord,
  CommentLinkResourceType,
  CommentRecord
} from '@/modules/comments/helpers/types'
import { CommentsEmitter, CommentsEvents } from '@/modules/comments/events/emitter'
import {
  addCommentArchivedActivity,
  addCommentCreatedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import {
  formatSerializedViewerState,
  inputToDataStruct
} from '@/modules/comments/services/data'

export async function authorizeProjectCommentsAccess(params: {
  projectId: string
  authCtx: AuthContext
  requireProjectRole?: boolean
}) {
  const { projectId, authCtx, requireProjectRole } = params
  if (authCtx.role === Roles.Server.ArchivedUser) {
    throw new ForbiddenError('You are not authorized')
  }

  const project = await getStream({ streamId: projectId, userId: authCtx.userId })
  if (!project) {
    throw new StreamInvalidAccessError('Stream not found')
  }

  let success = true
  if (!project.isPublic && !authCtx.auth) success = false
  if (!project.isPublic && !project.role) success = false
  if (requireProjectRole && !project.role && !project.allowPublicComments)
    success = false

  if (!success) {
    throw new StreamInvalidAccessError('You are not authorized')
  }

  return project
}

export async function authorizeCommentAccess(params: {
  authCtx: AuthContext
  commentId: string
  requireProjectRole?: boolean
}) {
  const { authCtx, commentId, requireProjectRole } = params
  const comment = await getComment({ id: commentId, userId: authCtx.userId })
  if (!comment) {
    throw new StreamInvalidAccessError('Attempting to access a nonexistant comment')
  }

  return authorizeProjectCommentsAccess({
    projectId: comment.streamId,
    authCtx,
    requireProjectRole
  })
}

export async function markViewed(commentId: string, userId: string) {
  await markCommentViewed(commentId, userId)
}

export async function createCommentThreadAndNotify(
  input: CreateCommentInput,
  userId: string
) {
  const [resources] = await Promise.all([
    getViewerResourceItemsUngrouped({ ...input, loadedVersionsOnly: true }),
    validateInputAttachments(input.projectId, input.content.blobIds || [])
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
    comment = await knex.transaction(async (trx) => {
      const comment = await insertComment(commentPayload, { trx })

      const links: CommentLinkRecord[] = resources.map((r) => {
        let resourceId = r.objectId
        let resourceType: CommentLinkResourceType = 'object'
        if (r.versionId) {
          resourceId = r.versionId
          resourceType = 'commit'
        }

        return {
          commentId: comment.id,
          resourceId,
          resourceType
        }
      })
      await insertCommentLinks(links, { trx })

      return comment
    })
  } catch (e) {
    throw new CommentCreateError('Comment creation failed', { cause: ensureError(e) })
  }

  // Mark as viewed and emit events
  await Promise.all([
    markViewed(comment.id, userId),
    CommentsEmitter.emit(CommentsEvents.Created, {
      comment
    }),
    addCommentCreatedActivity({
      streamId: input.projectId,
      userId,
      input: {
        ...input,
        resolvedResourceItems: resources
      },
      comment
    })
  ])

  return comment
}

export async function createCommentReplyAndNotify(
  input: CreateCommentReplyInput,
  userId: string
) {
  const thread = await getComment({ id: input.threadId, userId })
  if (!thread) {
    throw new CommentCreateError('Reply creation failed due to nonexistant thread')
  }
  await validateInputAttachments(thread.streamId, input.content.blobIds || [])

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
    reply = await knex.transaction(async (trx) => {
      const reply = await insertComment(commentPayload, { trx })
      const links: CommentLinkRecord[] = [
        { resourceType: 'comment', resourceId: thread.id, commentId: reply.id }
      ]
      await insertCommentLinks(links, { trx })

      return reply
    })
  } catch (e) {
    throw new CommentCreateError('Reply creation failed', { cause: ensureError(e) })
  }

  // Mark parent comment updated and emit events
  await Promise.all([
    markCommentUpdated(thread.id),
    CommentsEmitter.emit(CommentsEvents.Created, {
      comment: reply
    }),
    addReplyAddedActivity({
      streamId: thread.streamId,
      input,
      reply,
      userId
    })
  ])

  return reply
}

export async function editCommentAndNotify(input: EditCommentInput, userId: string) {
  const comment = await getComment({ id: input.commentId, userId })
  if (!comment) {
    throw new CommentUpdateError('Comment update failed due to nonexistant comment')
  }
  if (comment.authorId !== userId) {
    throw new CommentUpdateError("You cannot edit someone else's comments")
  }

  await validateInputAttachments(comment.streamId, input.content.blobIds || [])
  const updatedComment = await updateComment(comment.id, {
    text: buildCommentTextFromInput({
      doc: input.content.doc,
      blobIds: input.content.blobIds || undefined
    })
  })

  await Promise.all([
    CommentsEmitter.emit(CommentsEvents.Updated, {
      previousComment: comment,
      newComment: updatedComment
    })
  ])

  return updatedComment
}

export async function archiveCommentAndNotify(
  commentId: string,
  userId: string,
  archived = true
) {
  const comment = await getComment({ id: commentId, userId })
  if (!comment) {
    throw new CommentUpdateError(
      "Specified comment doesn't exist and thus it's archival status can't be changed"
    )
  }

  const stream = await getStream({ streamId: comment.streamId, userId })
  if (!stream || (comment.authorId !== userId && stream.role !== Roles.Stream.Owner)) {
    throw new CommentUpdateError('You do not have permissions to archive this comment')
  }
  const updatedComment = await updateComment(comment.id, {
    archived
  })

  await Promise.all([
    addCommentArchivedActivity({
      streamId: stream.id,
      commentId,
      userId,
      input: {
        archived,
        streamId: stream.id,
        commentId
      },
      comment: updatedComment
    })
  ])

  return updatedComment
}
