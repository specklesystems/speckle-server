import { db } from '@/db/knex'
import { moduleLogger } from '@/logging/logging'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addStreamCommentMentionActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { notifyUsersOnCommentEventsFactory } from '@/modules/comments/services/notifications'
import { publishNotification } from '@/modules/notifications/services/publication'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'

let unsubFromEvents: Optional<() => void> = undefined

const commentsModule: SpeckleModule = {
  async init(_, isInitial) {
    moduleLogger.info('🗣  Init comments module')

    if (isInitial) {
      const notifyUsersOnCommentEvents = notifyUsersOnCommentEventsFactory({
        eventBus: getEventBus(),
        publish: publishNotification,
        addStreamCommentMentionActivity: addStreamCommentMentionActivityFactory({
          saveActivity: saveActivityFactory({ db })
        })
      })
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
