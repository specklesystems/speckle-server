import { moduleLogger } from '@/logging/logging'
import {
  setupResultListener,
  shutdownResultListener
} from '@/modules/core/utils/dbNotificationListener'
import * as mp from '@/modules/shared/utils/mixpanel'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'

import staticRest from '@/modules/core/rest/static'
import uploadRest from '@/modules/core/rest/upload'
import uploadV2Rest from '@/modules/core/rest/uploadV2'
import downloadRest from '@/modules/core/rest/download'
import diffUpload from '@/modules/core/rest/diffUpload'
import diffDownload from '@/modules/core/rest/diffDownload'
import healthRest from '@/modules/core/rest/health'
import scopes from '@/modules/core/scopes'
import roles from '@/modules/core/roles'
import Redis from 'ioredis'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'

let genericRedisClient: Optional<Redis> = undefined

const coreModule: SpeckleModule<{
  getGenericRedis: () => Redis
}> = {
  async init(app, isInitial) {
    moduleLogger.info('💥 Init core module')

    // Initialize the static route
    staticRest(app)

    // Initialize the health check route
    healthRest(app)

    // Initialises the two main bulk upload/download endpoints
    uploadRest(app)
    uploadV2Rest(app)
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
      genericRedisClient = createRedisClient(getRedisUrl(), {})
    }
  },
  async shutdown() {
    await shutdownResultListener()

    if (genericRedisClient) {
      await genericRedisClient.quit()
    }
  },
  /**
   * A general purpose redis client that can be used after safely all modules are initialized
   */
  getGenericRedis() {
    if (!genericRedisClient) {
      throw new UninitializedResourceAccessError('Generic redis client not initialized')
    }
    return genericRedisClient
  }
}

export = coreModule
