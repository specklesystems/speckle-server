import { CommentRecord } from '@/modules/comments/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum CommentsEvents {
  Created = 'created',
  Updated = 'updated'
}

const { emit, listen } = initializeModuleEventEmitter<{
  // Add mappings between events & payloads here
  [CommentsEvents.Created]: { comment: CommentRecord }
  [CommentsEvents.Updated]: {
    previousComment: CommentRecord
    newComment: CommentRecord
  }
}>({
  moduleName: 'comments'
})

export const CommentsEmitter = { emit, listen, events: CommentsEvents }
export type CommentsEventsEmit = typeof emit
export type CommentsEventsListen = typeof listen
