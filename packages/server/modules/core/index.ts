import { registerOrUpdateScope, registerOrUpdateRole } from '@/modules/shared'
import { moduleLogger } from '@/logging/logging'
import {
  setupResultListener,
  shutdownResultListener
} from '@/modules/core/utils/dbNotificationListener'
import { initialize as initializeMixpanel } from '@/modules/shared/utils/mixpanel'
import type { Application } from 'express'
import staticRoute from './rest/static'
import uploadRoute from './rest/upload'
import downloadRoute from './rest/download'
import diffUploadRoute from './rest/diffUpload'
import diffDownloadRoute from './rest/diffDownload'
import allScopes from './scopes'
import allRoles from './roles'

export const init = async (app: Application) => {
  moduleLogger.info('💥 Init core module')
  // Initialize the static route
  staticRoute(app)

  // Initialises the two main bulk upload/download endpoints
  uploadRoute(app)
  downloadRoute(app)

  // Initialises the two diff-based upload/download endpoints
  diffUploadRoute(app)
  diffDownloadRoute(app)

  // Register core-based scopes
  for (const scope of allScopes) {
    await registerOrUpdateScope(scope)
  }

  // Register core-based roles
  for (const role of allRoles) {
    await registerOrUpdateRole(role)
  }

  // Setup global pg notification listener
  setupResultListener()

  initializeMixpanel()
}

export const finalize = () => {}

export const shutdown = () => {
  shutdownResultListener()
}
