import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { registerOrUpdateScope, registerOrUpdateRole } from '@/modules/shared'
import staticApi from '@/modules/core/rest/static'
import roles from '@/modules/core/roles'
import scopes from '@/modules/core/scopes'
import { initializeEventListeners } from '@/modules/core/services/eventListeners'

let quitListeners: Optional<() => void> = undefined

const coreModule: SpeckleModule = {
  async init(app, isInitial) {
    modulesDebug('💥 Init core module')

    // Initialize the static route
    staticApi(app)

    // Initialises the two main bulk upload/download endpoints
    ;(await import('./rest/upload')).default(app)
    ;(await import('./rest/download')).default(app)

    // Initialises the two diff-based upload/download endpoints
    ;(await import('./rest/diffUpload')).default(app)
    ;(await import('./rest/diffDownload')).default(app)

    // Register core-based scoeps
    for (const scope of scopes) {
      await registerOrUpdateScope(scope)
    }

    // // Register core-based roles
    for (const role of roles) {
      await registerOrUpdateRole(role)
    }
    if (isInitial) quitListeners = initializeEventListeners()
  },
  shutdown() {
    quitListeners?.()
  }
}

export = {
  ...coreModule
}
