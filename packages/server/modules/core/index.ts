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

const coreModule: SpeckleModule = {
  async init(app, isInitial) {
    moduleLogger.info('💥 Init core module')

    // Initialize the static route
    staticRest(app)

    // Initialises the two main bulk upload/download endpoints
    uploadRest(app)
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

      // Generic redis client
    }
  },
  async shutdown() {
    await shutdownResultListener()

    await getGenericRedis().quit()
  }
}

export = coreModule
