import cron from 'node-cron'
import { moduleLogger } from '@/observability/logging'
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
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import {
  deleteWorkspaceFactory,
  getWorkspacesNonCompleteFactory
} from '@/modules/workspaces/repositories/workspaces'
import { deleteWorkspacesNonCompleteFactory } from '@/modules/workspaces/services/management'

const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_SSO_ENABLED } = getFeatureFlags()

let quitListeners: Optional<() => void> = undefined
let scheduledTasks: cron.ScheduledTask[] = []

const initScopes = async () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  await Promise.all(workspaceScopes.map((scope) => registerFunc({ scope })))
}

const initRoles = async () => {
  const registerFunc = registerOrUpdateRole({ db })
  await Promise.all(workspaceRoles.map((role) => registerFunc({ role })))
}

const scheduleDeleteWorkspacesNonComplete = ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const deleteWorkspacesNonComplete = deleteWorkspacesNonCompleteFactory({
    getWorkspacesNonComplete: getWorkspacesNonCompleteFactory({ db }),
    deleteWorkspace: deleteWorkspaceFactory({ db })
  })

  const DAILY_AT_1_AM = '0 1 * * *'
  return scheduleExecution(
    DAILY_AT_1_AM,
    'DeleteWorkspaceNonComplete',
    async (_scheduledTime, { logger }) => {
      await Promise.all([deleteWorkspacesNonComplete({ logger })])
    }
  )
}

const workspacesModule: SpeckleModule = {
  async init({ app, isInitial }) {
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
      const scheduleExecution = scheduleExecutionFactory({
        acquireTaskLock: acquireTaskLockFactory({ db }),
        releaseTaskLock: releaseTaskLockFactory({ db })
      })

      scheduledTasks = [scheduleDeleteWorkspacesNonComplete({ scheduleExecution })]

      quitListeners = initializeEventListenersFactory({ db })()
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
