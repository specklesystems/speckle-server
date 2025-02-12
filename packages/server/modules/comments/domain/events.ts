import { CommentRecord } from '@/modules/comments/helpers/types'

export const commentEventsNamespace = 'comments' as const

export const CommentEvents = {
  Created: `${commentEventsNamespace}.created`,
  Updated: `${commentEventsNamespace}.updated`
} as const

export type CommentEventsPayloads = {
  [CommentEvents.Created]: { comment: CommentRecord }
  [CommentEvents.Updated]: {
    previousComment: CommentRecord
    newComment: CommentRecord
  }
}
