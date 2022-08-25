import { CommentRecord } from '@/modules/comments/helpers/types'
import { MaybeAsync } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { EventEmitter } from 'node:events'

const debug = modulesDebug.extend('comments-events')

const errHandler = (e: unknown) => {
  debug(e)
}

const eventEmitter = new EventEmitter()
eventEmitter.on('uncaughtException', errHandler)
eventEmitter.on('error', errHandler)

export enum CommentsEvents {
  Created = 'created',
  Updated = 'updated'
}

// Add mappings between event types and expected payloads here
type CommentsEventPayloadMap = {
  [CommentsEvents.Created]: { comment: CommentRecord }
  [CommentsEvents.Updated]: {
    previousComment: CommentRecord
    newComment: CommentRecord
  }
} & { [k in CommentsEvents]: unknown }

export type CommentsEventHandler<T extends CommentsEvents> = (
  payload: CommentsEventPayloadMap[T]
) => MaybeAsync<void>

/**
 * Emit a comments event
 */
export function emitCommentEvent<T extends CommentsEvents>(
  eventName: T,
  payload: CommentsEventPayloadMap[T]
) {
  eventEmitter.emit(eventName, payload)
}

/**
 * Listens to a comments event
 * @returns Function to invoke to stop listening
 */
export function onCommentEvent<T extends CommentsEvents>(
  eventName: T,
  handler: CommentsEventHandler<T>
) {
  const onHandler = (event: CommentsEventPayloadMap[T]) => {
    // This is important: Without this errors in async event handlers will
    // kill the process
    try {
      // In case handler is async
      Promise.resolve(handler(event)).catch(errHandler)
    } catch (e: unknown) {
      // In case it isn't
      errHandler(e)
    }
  }

  eventEmitter.on(eventName, onHandler)

  return () => {
    eventEmitter.removeListener(eventName, onHandler)
  }
}
