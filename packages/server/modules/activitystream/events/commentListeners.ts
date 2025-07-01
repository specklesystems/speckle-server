import {
  AddThreadCreatedActivity,
  AddReplyAddedActivity,
  SaveStreamActivity,
  AddCommentArchivedActivity
} from '@/modules/activitystream/domain/operations'
import {
  CommentCreatedActivityInput,
  ReplyCreatedActivityInput
} from '@/modules/activitystream/domain/types'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { CommentEvents, CommentEventsPayloads } from '@/modules/comments/domain/events'
import { ReplyCreateInput } from '@/modules/core/graph/generated/graphql'
import { EventBusListen } from '@/modules/shared/services/eventBus'
import { has } from 'lodash-es'
import { OverrideProperties } from 'type-fest'

const addThreadCreatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveStreamActivity }): AddThreadCreatedActivity =>
  async (params) => {
    const { input, comment } = params

    await saveActivity({
      resourceId: comment.id,
      streamId: comment.streamId,
      resourceType: StreamResourceTypes.Comment,
      actionType: StreamActionTypes.Comment.Create,
      userId: comment.authorId,
      info: { input },
      message: `Comment added: ${comment.id} (${input})`
    })
  }

const isLegacyReplyCreateInput = (
  i: ReplyCreatedActivityInput
): i is ReplyCreateInput => has(i, 'streamId')

const addReplyAddedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveStreamActivity }): AddReplyAddedActivity =>
  async (params) => {
    const { input, reply } = params

    const parentCommentId = isLegacyReplyCreateInput(input)
      ? input.parentComment
      : input.threadId
    await saveActivity({
      streamId: reply.streamId,
      resourceType: StreamResourceTypes.Comment,
      resourceId: parentCommentId,
      actionType: StreamActionTypes.Comment.Reply,
      userId: reply.authorId,
      info: { input },
      message: `Comment reply #${reply.id} created`
    })
  }

const addCommentArchivedActivityFactory =
  ({
    saveActivity
  }: {
    saveActivity: SaveStreamActivity
  }): AddCommentArchivedActivity =>
  async (params) => {
    const { userId, input, comment } = params

    await saveActivity({
      streamId: comment.streamId,
      resourceType: StreamResourceTypes.Comment,
      resourceId: comment.id,
      actionType: StreamActionTypes.Comment.Archive,
      userId,
      info: { input },
      message: `Comment #${comment.id} archived`
    })
  }

const isReplyCreatedPayload = (
  payload: CommentEventsPayloads[typeof CommentEvents.Created]
): payload is OverrideProperties<
  CommentEventsPayloads[typeof CommentEvents.Created],
  {
    input: ReplyCreatedActivityInput
  }
> => {
  return payload.isThread === false
}

const isThreadCreatedPayload = (
  payload: CommentEventsPayloads[typeof CommentEvents.Created]
): payload is OverrideProperties<
  CommentEventsPayloads[typeof CommentEvents.Created],
  {
    input: CommentCreatedActivityInput
  }
> => {
  return payload.isThread
}

export const reportCommentActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveStreamActivity }) => () => {
    const addThreadCreatedActivity = addThreadCreatedActivityFactory(deps)
    const addReplyAddedActivity = addReplyAddedActivityFactory(deps)
    const addCommentArchivedActivity = addCommentArchivedActivityFactory(deps)

    const quitters = [
      deps.eventListen(CommentEvents.Created, async ({ payload }) => {
        if (isReplyCreatedPayload(payload)) {
          await addReplyAddedActivity({
            reply: payload.comment,
            input: payload.input
          })
        } else if (isThreadCreatedPayload(payload)) {
          await addThreadCreatedActivity(payload)
        }
      }),
      deps.eventListen(CommentEvents.Archived, async ({ payload }) => {
        await addCommentArchivedActivity(payload)
      })
    ]

    return () => {
      quitters.forEach((quit) => quit())
    }
  }
