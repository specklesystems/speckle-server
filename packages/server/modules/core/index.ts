import { moduleLogger } from '@/logging/logging'
import {
  setupResultListener,
  shutdownResultListener
} from '@/modules/core/utils/dbNotificationListener'
import * as mp from '@/modules/shared/utils/mixpanel'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

import staticRest from '@/modules/core/rest/static'
import uploadRest from '@/modules/core/rest/upload'
import downloadRest from '@/modules/core/rest/download'
import diffUpload from '@/modules/core/rest/diffUpload'
import diffDownload from '@/modules/core/rest/diffDownload'
import scopes from '@/modules/core/scopes'
import roles from '@/modules/core/roles'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { HooksConfig, Hook, ExecuteHooks } from '@/modules/core/hooks'
import { reportSubscriptionEventsFactory } from '@/modules/core/events/subscriptionListeners'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'

let stopTestSubs: (() => void) | undefined = undefined

const coreModule: SpeckleModule<{
  hooks: HooksConfig
  addHook: (key: keyof HooksConfig, hook: Hook) => void
  executeHooks: ExecuteHooks
}> = {
  hooks: {
    onCreateObjectRequest: [],
    onCreateVersionRequest: []
  },
  addHook(key: keyof HooksConfig, callback: Hook) {
    this.hooks[key].push(callback)
  },
  async executeHooks(key: keyof HooksConfig, { projectId }: { projectId: string }) {
    return await Promise.all(this.hooks[key].map(async (cb) => await cb({ projectId })))
  },
  async init(app, isInitial) {
    moduleLogger.info('💥 Init core module')

    // Initialize the static route
    staticRest(app)

    // Initialises the two main bulk upload/download endpoints
    uploadRest(app, { executeHooks: this.executeHooks.bind(this) })
    downloadRest(app)

    // Initialises the two diff-based upload/download endpoints
    diffUpload(app)
    diffDownload(app)

    const scopeRegisterFunc = registerOrUpdateScopeFactory({ db })
    // Register core-based scoeps
    for (const scope of scopes) {
      await scopeRegisterFunc({ scope })
    }

    const roleRegisterFunc = registerOrUpdateRole({ db })
    // Register core-based roles
    for (const role of roles) {
      await roleRegisterFunc({ role })
    }

    if (isInitial) {
      // Setup global pg notification listener
      setupResultListener()

      // Init mp
      mp.initialize()

      // Setup test subs
      if (isTestEnv()) {
        const { startEmittingTestSubs } = await import('@/test/graphqlHelper')
        stopTestSubs = await startEmittingTestSubs()
      }

      // Setup GQL sub emits
      reportSubscriptionEventsFactory({
        eventListen: getEventBus().listen,
        publish
      })()
    }
  },
  async shutdown() {
    await shutdownResultListener()
    await getGenericRedis().quit()
    stopTestSubs?.()
  }
}

export default coreModule
