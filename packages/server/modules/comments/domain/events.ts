import type {
  CommentCreatedActivityInput,
  ReplyCreatedActivityInput
} from '@/modules/activitystream/domain/types'
import type { ViewerResourceItem } from '@/modules/viewer/domain/types/resources'
import type { CommentRecord } from '@/modules/comments/helpers/types'
import type { MutationCommentArchiveArgs } from '@/modules/core/graph/generated/graphql'

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
