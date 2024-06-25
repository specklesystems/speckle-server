import { moduleLogger } from '@/logging/logging'
import {
  notifyUsersOnCommentEvents
} from '@/modules/comments/services/notifications'

let unsubFromEvents: (() => void) | undefined

export const init = async (_: never, isInitial: boolean) => {
  moduleLogger.info('🗣  Init comments module')

  if (isInitial) {
    unsubFromEvents = await notifyUsersOnCommentEvents()
  }
}

export const finalize = async () => { }

export const shutdown = async () => {
  unsubFromEvents?.()
  unsubFromEvents = undefined
}
