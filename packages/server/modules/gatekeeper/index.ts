import type cron from 'node-cron'
import { moduleLogger } from '@/observability/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getBillingRouter } from '@/modules/gatekeeper/rest/billing'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { db } from '@/db/knex'
import { gatekeeperScopes } from '@/modules/gatekeeper/scopes'
import { initializeEventListenersFactory } from '@/modules/gatekeeper/events/eventListener'
import {
  getWorkspacePlanProductAndPriceIds,
  getWorkspacePlanProductId
} from '@/modules/gatekeeper/helpers/prices'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import {
  getWorkspacePlanByProjectIdFactory,
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionsPastBillingCycleEndFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import {
  getStripeClient,
  getStripeSubscriptionDataFactory,
  reconcileWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/clients/stripe'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import coreModule from '@/modules/core/index'
import { isProjectReadOnlyFactory } from '@/modules/gatekeeper/services/readOnly'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'
import { InvalidLicenseError } from '@/modules/gatekeeper/errors/license'
import {
  downscaleWorkspaceSubscriptionFactory,
  manageSubscriptionDownscaleFactory
} from '@/modules/gatekeeper/services/subscriptions/manageSubscriptionDownscale'
import { countSeatsByTypeInWorkspaceFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'

const { FF_GATEKEEPER_MODULE_ENABLED, FF_BILLING_INTEGRATION_ENABLED } =
  getFeatureFlags()

const initScopes = async () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  await Promise.all(gatekeeperScopes.map((scope) => registerFunc({ scope })))
}

const scheduleWorkspaceSubscriptionDownscale = ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const getStripeSubscriptionData = getStripeSubscriptionDataFactory({
    getStripeClient
  })
  const manageSubscriptionDownscale = manageSubscriptionDownscaleFactory({
    downscaleWorkspaceSubscription: downscaleWorkspaceSubscriptionFactory({
      countSeatsByTypeInWorkspace: countSeatsByTypeInWorkspaceFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({
        getStripeClient,
        getStripeSubscriptionData
      }),
      getWorkspacePlanProductId
    }),
    getWorkspaceSubscriptions: getWorkspaceSubscriptionsPastBillingCycleEndFactory({
      db
    }),
    getStripeSubscriptionData,
    updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db })
  })

  const cronExpression = '*/5 * * * *' // every 5 minutes
  return scheduleExecution(
    cronExpression,
    'WorkspaceSubscriptionDownscale',
    async (_scheduledTime, { logger }) => {
      await Promise.all([
        manageSubscriptionDownscale({ logger }) // Only takes new plans subscriptions
      ])
    }
  )
}

let scheduledTasks: cron.ScheduledTask[] = []
let quitListeners: (() => void) | undefined = undefined

const gatekeeperModule: SpeckleModule = {
  async init({ app, isInitial }) {
    await initScopes()
    if (!FF_GATEKEEPER_MODULE_ENABLED) return

    const isLicenseValid = await validateModuleLicense({
      requiredModules: ['gatekeeper']
    })
    if (!isLicenseValid)
      throw new InvalidLicenseError(
        'The gatekeeper module needs a valid license to run, contact Speckle to get one.'
      )

    moduleLogger.info('🗝️  Init gatekeeper module')

    if (isInitial) {
      // TODO: need to subscribe to the workspaceCreated event and store the workspacePlan as a trial if billing enabled, else store as unlimited
      if (FF_BILLING_INTEGRATION_ENABLED) {
        // this validates that product and priceId-s can be loaded on server startup
        getWorkspacePlanProductAndPriceIds()
        app.use(getBillingRouter())

        const scheduleExecution = scheduleExecutionFactory({
          acquireTaskLock: acquireTaskLockFactory({ db }),
          releaseTaskLock: releaseTaskLockFactory({ db })
        })

        scheduledTasks = [scheduleWorkspaceSubscriptionDownscale({ scheduleExecution })]

        quitListeners = initializeEventListenersFactory({
          db,
          getStripeClient
        })()

        const isLicenseValid = await validateModuleLicense({
          requiredModules: ['billing']
        })
        if (!isLicenseValid)
          throw new InvalidLicenseError(
            'The the billing module needs a valid license to run, contact Speckle to get one.'
          )
        // TODO: create a cron job, that removes unused seats from the subscription at the beginning of each workspace plan's billing cycle
      }
    }
  },
  async shutdown() {
    if (quitListeners) quitListeners()
    scheduledTasks.forEach((task) => {
      task.stop()
    })
  },
  async finalize() {
    coreModule.addHook('onCreateObjectRequest', isProjectReadOnly)
    coreModule.addHook('onCreateVersionRequest', isProjectReadOnly)
  }
}

async function isProjectReadOnly({ projectId }: { projectId: string }) {
  const readOnly = await isProjectReadOnlyFactory({
    getWorkspacePlanByProjectId: getWorkspacePlanByProjectIdFactory({
      db
    })
  })({ projectId })
  if (readOnly) throw new WorkspaceReadOnlyError()
}

export default gatekeeperModule
