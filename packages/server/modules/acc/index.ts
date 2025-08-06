import type { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { db } from '@/db/knex'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { setupAccOidcEndpoints } from '@/modules/acc/rest/oidc'
import { setupAccWebhookEndpoints } from '@/modules/acc/rest/webhooks'
import { schedulePendingSyncItemsCheck } from '@/modules/acc/services/cron'
import { reportSubscriptionEventsFactory } from '@/modules/acc/events/eventListeners'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'

const { FF_ACC_INTEGRATION_ENABLED, FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const scheduleExecution = scheduleExecutionFactory({
  acquireTaskLock: acquireTaskLockFactory({ db }),
  releaseTaskLock: releaseTaskLockFactory({ db })
})

let quitListeners: Optional<() => void> = undefined
let scheduledTask: ReturnType<ScheduleExecution> | null = null

const accModule: SpeckleModule = {
  init: async ({ app, isInitial }) => {
    if (!FF_ACC_INTEGRATION_ENABLED || !FF_AUTOMATE_MODULE_ENABLED) return

    moduleLogger.info('🖕 Init ACC module')

    if (isInitial) {
      setupAccOidcEndpoints(app)
      setupAccWebhookEndpoints(app)
      quitListeners = reportSubscriptionEventsFactory({
        eventListen: getEventBus().listen,
        publish
      })()
      scheduledTask = schedulePendingSyncItemsCheck({ scheduleExecution })
    }
  },
  shutdown: () => {
    quitListeners?.()
    scheduledTask?.stop?.()
  },
  finalize: () => {}
}

export default accModule
