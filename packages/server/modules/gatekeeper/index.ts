import cron from 'node-cron'
import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getBillingRouter } from '@/modules/gatekeeper/rest/billing'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { db } from '@/db/knex'
import { gatekeeperScopes } from '@/modules/gatekeeper/scopes'
import { initializeEventListenersFactory } from '@/modules/gatekeeper/events/eventListener'
import { getStripeClient } from '@/modules/gatekeeper/stripe'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const initScopes = async () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  await Promise.all(gatekeeperScopes.map((scope) => registerFunc({ scope })))
}

const scheduleWorkspaceSubscriptionDownscale = () => {
  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const cronExpression = '*/10 * * * * *'
  return scheduleExecution(
    cronExpression,
    'WorkspaceSubscriptionDownscale',
    async () => {
      moduleLogger.info('Starting workspace subscription downscale scan')
      // await cleanOrphanedWebhookConfigs()
      moduleLogger.info('Finished cleanup')
    }
  )
}

let scheduledTask: cron.ScheduledTask | undefined = undefined
let quitListeners: (() => void) | undefined = undefined

const gatekeeperModule: SpeckleModule = {
  async init(app, isInitial) {
    await initScopes()
    if (!FF_GATEKEEPER_MODULE_ENABLED) return

    const isLicenseValid = await validateModuleLicense({
      requiredModules: ['gatekeeper']
    })
    if (!isLicenseValid)
      throw new Error(
        'The gatekeeper module needs a valid license to run, contact Speckle to get one.'
      )

    moduleLogger.info('🗝️  Init gatekeeper module')

    if (isInitial) {
      // TODO: need to subscribe to the workspaceCreated event and store the workspacePlan as a trial if billing enabled, else store as unlimited
      if (FF_BILLING_INTEGRATION_ENABLED) {
        app.use(getBillingRouter())

        scheduledTask = scheduleWorkspaceSubscriptionDownscale()

        quitListeners = initializeEventListenersFactory({
          db,
          stripe: getStripeClient()
        })()

        const isLicenseValid = await validateModuleLicense({
          requiredModules: ['billing']
        })
        if (!isLicenseValid)
          throw new Error(
            'The the billing module needs a valid license to run, contact Speckle to get one.'
          )
        // TODO: create a cron job, that removes unused seats from the subscription at the beginning of each workspace plan's billing cycle
      }
    }
  },
  async shutdown() {
    if (quitListeners) quitListeners()
    if (scheduledTask) scheduledTask.stop()
  }
}
export = gatekeeperModule
