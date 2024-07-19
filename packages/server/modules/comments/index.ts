import { moduleLogger } from '@/logging/logging'
import { notifyUsersOnCommentEvents } from '@/modules/comments/services/notifications'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

let unsubFromEvents: Optional<() => void> = undefined

const commentsModule: SpeckleModule = {
  async init(_, isInitial) {
    moduleLogger.info('🗣  Init comments module')

    if (isInitial) {
      unsubFromEvents = await notifyUsersOnCommentEvents()
    }
  },
  async finalize() {},
  async shutdown() {
    unsubFromEvents?.()
    unsubFromEvents = undefined
  }
}

export = commentsModule
