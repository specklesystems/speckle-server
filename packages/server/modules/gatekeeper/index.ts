import cron from 'node-cron'
import { moduleLogger } from '@/observability/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getBillingRouter } from '@/modules/gatekeeper/rest/billing'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { db } from '@/db/knex'
import { gatekeeperScopes } from '@/modules/gatekeeper/scopes'
import { initializeEventListenersFactory } from '@/modules/gatekeeper/events/eventListener'
import { getStripeClient, getWorkspacePlanProductId } from '@/modules/gatekeeper/stripe'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import {
  downscaleWorkspaceSubscriptionFactory,
  manageSubscriptionDownscaleFactory
} from '@/modules/gatekeeper/services/subscriptions'
import {
  changeExpiredTrialWorkspacePlanStatusesFactory,
  getWorkspacePlanByProjectIdFactory,
  getWorkspacePlanFactory,
  getWorkspacesByPlanAgeFactory,
  getWorkspaceSubscriptionsPastBillingCycleEndFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceCollaboratorsFactory
} from '@/modules/workspaces/repositories/workspaces'
import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { EventBusEmit, getEventBus } from '@/modules/shared/services/eventBus'
import { sendWorkspaceTrialExpiresEmailFactory } from '@/modules/gatekeeper/services/trialEmails'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { findEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'
import { sendEmail } from '@/modules/emails/services/sending'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import coreModule from '@/modules/core/index'
import { isProjectReadOnlyFactory } from '@/modules/gatekeeper/services/readOnly'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'
import { InvalidLicenseError } from '@/modules/gatekeeper/errors/license'

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
  const stripe = getStripeClient()

  const manageSubscriptionDownscale = manageSubscriptionDownscaleFactory({
    downscaleWorkspaceSubscription: downscaleWorkspaceSubscriptionFactory({
      countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      reconcileSubscriptionData: reconcileWorkspaceSubscriptionFactory({ stripe }),
      getWorkspacePlanProductId
    }),
    getWorkspaceSubscriptions: getWorkspaceSubscriptionsPastBillingCycleEndFactory({
      db
    }),
    updateWorkspaceSubscription: upsertWorkspaceSubscriptionFactory({ db })
  })

  const cronExpression = '*/5 * * * *' // every 5 minutes
  return scheduleExecution(
    cronExpression,
    'WorkspaceSubscriptionDownscale',
    async (_scheduledTime, { logger }) => {
      await manageSubscriptionDownscale({ logger })
    }
  )
}

const scheduleWorkspaceTrialEmails = ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const sendWorkspaceTrialEmail = sendWorkspaceTrialExpiresEmailFactory({
    getServerInfo: getServerInfoFactory({ db }),
    getUserEmails: findEmailsByUserIdFactory({ db }),
    getWorkspaceCollaborators: getWorkspaceCollaboratorsFactory({ db }),
    sendEmail,
    renderEmail
  })
  // TODO: make this a daily thing
  // const cronExpression = '*/5 * * * * *'
  // every day at noon
  const cronExpression = '0 12 * * *'
  return scheduleExecution(
    cronExpression,
    'WorkspaceTrialEmails',
    async (_scheduledTime, { logger }) => {
      logger.info('Sending workspace trial emails.')
      const getWorkspacesByPlanAge = getWorkspacesByPlanAgeFactory({ db })
      const trialValidForDays = 31
      const trialWorkspacesExpireIn3Days = await getWorkspacesByPlanAge({
        daysTillExpiry: 3,
        planValidFor: trialValidForDays,
        plan: 'starter',
        status: 'trial'
      })
      if (trialWorkspacesExpireIn3Days.length) {
        await Promise.all(
          trialWorkspacesExpireIn3Days.map((workspace) =>
            sendWorkspaceTrialEmail({ workspace, expiresInDays: 3 })
          )
        )
      }
      const trialWorkspacesExpireToday = await getWorkspacesByPlanAge({
        daysTillExpiry: 0,
        planValidFor: trialValidForDays,
        plan: 'starter',
        status: 'trial'
      })
      if (trialWorkspacesExpireToday.length) {
        await Promise.all(
          trialWorkspacesExpireToday.map((workspace) =>
            sendWorkspaceTrialEmail({ workspace, expiresInDays: 0 })
          )
        )
      }
    }
  )
}

const scheduleWorkspaceTrialExpiry = ({
  scheduleExecution,
  emit
}: {
  scheduleExecution: ScheduleExecution
  emit: EventBusEmit
}) => {
  const changeExpiredStatuses = changeExpiredTrialWorkspacePlanStatusesFactory({ db })
  const cronExpression = '*/5 * * * *'
  return scheduleExecution(
    cronExpression,
    'WorkspaceTrialExpiry',
    async (_scheduledTime, { logger }) => {
      const expiredWorkspacePlans = await changeExpiredStatuses({ numberOfDays: 31 })

      if (expiredWorkspacePlans.length) {
        logger.info(
          { workspaceIds: expiredWorkspacePlans.map((p) => p.workspaceId) },
          'Workspace trial expired for {workspaceIds}.'
        )
        await Promise.all(
          expiredWorkspacePlans.map(async (plan) => {
            emit({
              eventName: 'gatekeeper.workspace-trial-expired',
              payload: { workspaceId: plan.workspaceId }
            })
          })
        )
      }
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
        app.use(getBillingRouter())

        const eventBus = getEventBus()

        const scheduleExecution = scheduleExecutionFactory({
          acquireTaskLock: acquireTaskLockFactory({ db }),
          releaseTaskLock: releaseTaskLockFactory({ db })
        })

        scheduledTasks = [
          scheduleWorkspaceSubscriptionDownscale({ scheduleExecution }),
          scheduleWorkspaceTrialEmails({ scheduleExecution }),
          scheduleWorkspaceTrialExpiry({ scheduleExecution, emit: eventBus.emit })
        ]

        quitListeners = initializeEventListenersFactory({
          db,
          stripe: getStripeClient()
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

export = gatekeeperModule
