import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { moduleLogger } from '@/observability/logging'
import db from '@/db/knex'
import { Scopes } from '@speckle/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectInviteProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { reportSubscriptionEventsFactory } from '@/modules/serverinvites/events/subscriptionListeners'

const scopes = [
  {
    name: Scopes.Users.Invite,
    description: 'Invite others to join this server.',
    public: false
  }
]

export const init: SpeckleModule['init'] = async ({ isInitial }) => {
  moduleLogger.info('💌 Init invites module')

  const registerFunc = registerOrUpdateScopeFactory({ db })
  for (const scope of scopes) {
    await registerFunc({ scope })
  }

  if (isInitial) {
    // Setup GQL sub emits
    reportSubscriptionEventsFactory({
      eventListen: getEventBus().listen,
      publish,
      getProjectInviteProject: getProjectInviteProjectFactory({
        getStream: getStreamFactory({ db })
      })
    })()
  }
}
