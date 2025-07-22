import {
  CommentCreatedActivityInput,
  ReplyCreatedActivityInput
} from '@/modules/activitystream/domain/types'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { MutationCommentArchiveArgs } from '@/modules/core/graph/generated/graphql'
import { ViewerResourceItem } from '@/modules/viewer/domain/types/resources'

export const commentEventsNamespace = 'comments' as const

export const CommentEvents = {
  Created: `${commentEventsNamespace}.created`,
  Updated: `${commentEventsNamespace}.updated`,
  Archived: `${commentEventsNamespace}.archived`
} as const

export type CommentEventsPayloads = {
  [CommentEvents.Created]: {
    comment: CommentRecord
    isThread: boolean
    input: CommentCreatedActivityInput | ReplyCreatedActivityInput
    resourceItems: ViewerResourceItem[]
  }
  [CommentEvents.Updated]: {
    previousComment: CommentRecord
    newComment: CommentRecord
  }
  [CommentEvents.Archived]: {
    userId: string
    input: MutationCommentArchiveArgs
    comment: CommentRecord
  }
}
