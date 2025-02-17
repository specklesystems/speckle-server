import cron from 'node-cron'
import { moduleLogger } from '@/logging/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import { initializeEventListenersFactory } from '@/modules/workspaces/events/eventListener'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getSsoRouter } from '@/modules/workspaces/rest/sso'
import { InvalidLicenseError } from '@/modules/gatekeeper/errors/license'
import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getWorkspacesFactory } from '@/modules/workspaces/repositories/workspaces'
import { EventBusEmit, getEventBus } from '@/modules/shared/services/eventBus'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { GetWorkspaces } from '@/modules/workspaces/domain/operations'

const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_SSO_ENABLED } = getFeatureFlags()

const scheduleWorkspaceMetricsUpdate = ({
  scheduleExecution,
  getWorkspaces,
  emit
}: {
  scheduleExecution: ScheduleExecution
  getWorkspaces: GetWorkspaces
  emit: EventBusEmit
}) => {
  // run this every hour
  // but its ok, we're removing this code after the first run
  const cronExpression = '0 * * * *'
  return scheduleExecution(cronExpression, 'WorkspaceMetricsUpdate', async () => {
    const workspaces = await getWorkspaces({ workspaceIds: undefined })
    for (const workspace of workspaces) {
      await emit({ eventName: 'workspace.metrics', payload: { workspace } })
    }
  })
}

let scheduledTasks: cron.ScheduledTask[] = []
let quitListeners: Optional<() => void> = undefined

const initScopes = async () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  await Promise.all(workspaceScopes.map((scope) => registerFunc({ scope })))
}

const initRoles = async () => {
  const registerFunc = registerOrUpdateRole({ db })
  await Promise.all(workspaceRoles.map((role) => registerFunc({ role })))
}

const workspacesModule: SpeckleModule = {
  async init(app, isInitial) {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    const isWorkspaceLicenseValid = await validateModuleLicense({
      requiredModules: ['workspaces']
    })

    if (!isWorkspaceLicenseValid)
      throw new InvalidLicenseError(
        'The workspaces module needs a valid license to run, contact Speckle to get one.'
      )
    moduleLogger.info('⚒️  Init workspaces module')

    if (FF_WORKSPACES_SSO_ENABLED) app.use(getSsoRouter())

    if (isInitial) {
      quitListeners = initializeEventListenersFactory({ db })()
      const scheduleExecution = scheduleExecutionFactory({
        acquireTaskLock: acquireTaskLockFactory({ db }),
        releaseTaskLock: releaseTaskLockFactory({ db })
      })

      scheduledTasks = [
        scheduleWorkspaceMetricsUpdate({
          scheduleExecution,
          getWorkspaces: getWorkspacesFactory({ db }),
          emit: getEventBus().emit
        })
      ]
    }
    await Promise.all([initScopes(), initRoles()])
  },
  shutdown() {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    quitListeners?.()
    scheduledTasks.forEach((task) => {
      task.stop()
    })
  }
}

export = workspacesModule
