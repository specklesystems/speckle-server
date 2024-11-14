import { moduleLogger } from '@/logging/logging'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addStreamCommentMentionActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import { notifyUsersOnCommentEventsFactory } from '@/modules/comments/services/notifications'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { publishNotification } from '@/modules/notifications/services/publication'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

let unsubFromEvents: Optional<() => void> = undefined

const commentsModule: SpeckleModule = {
  async init(_, isInitial) {
    moduleLogger.info('🗣  Init comments module')

    if (isInitial) {
      const notifyUsersOnCommentEvents = notifyUsersOnCommentEventsFactory({
        commentsEventsListen: CommentsEmitter.listen,
        publish: publishNotification,
        addStreamCommentMentionActivityResolver: async ({ streamId }) => {
          const projectDb = await getProjectDbClient({ projectId: streamId })
          return addStreamCommentMentionActivityFactory({
            saveActivity: saveActivityFactory({ db: projectDb })
          })
        }
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
