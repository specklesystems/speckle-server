import { db } from '@/db/knex'
import { moduleLogger } from '@/observability/logging'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { reportSubscriptionEventsFactory } from '@/modules/comments/events/subscriptionListeners'
import { getCommentsResourcesFactory } from '@/modules/comments/repositories/comments'
import { notifyUsersOnCommentEventsFactory } from '@/modules/comments/services/notifications'
import { getCommitsAndTheirBranchIdsFactory } from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import {
  getViewerResourcesForCommentFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourcesFromLegacyIdentifiersFactory
} from '@/modules/core/services/commit/viewerResources'
import { publishNotification } from '@/modules/notifications/services/publication'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'

let unsubFromEvents: Optional<() => void> = undefined

const commentsModule: SpeckleModule = {
  async init({ isInitial }) {
    moduleLogger.info('🗣  Init comments module')

    if (isInitial) {
      const notifyUsersOnCommentEvents = notifyUsersOnCommentEventsFactory({
        eventBus: getEventBus(),
        publish: publishNotification,
        saveActivity: saveActivityFactory({ db })
      })
      unsubFromEvents = await notifyUsersOnCommentEvents()

      const getViewerResourcesFromLegacyIdentifiers =
        getViewerResourcesFromLegacyIdentifiersFactory({
          getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
            getCommentsResources: getCommentsResourcesFactory({ db }),
            getViewerResourcesFromLegacyIdentifiers: (...args) =>
              getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
          }),
          getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
          getStreamObjects: getStreamObjectsFactory({ db })
        })
      const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
        getCommentsResources: getCommentsResourcesFactory({ db }),
        getViewerResourcesFromLegacyIdentifiers: (...args) =>
          getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
      })

      reportSubscriptionEventsFactory({
        eventListen: getEventBus().listen,
        publish,
        getViewerResourcesForComment
      })()
    }
  },
  async finalize() {},
  async shutdown() {
    unsubFromEvents?.()
    unsubFromEvents = undefined
  }
}

export = commentsModule
