import type cron from 'node-cron'
import type { Logger } from '@/observability/logging'
import { moduleLogger } from '@/observability/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import type { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import { initializeEventListenersFactory } from '@/modules/workspaces/events/eventListener'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { getSsoRouter } from '@/modules/workspaces/rest/sso'
import { InvalidLicenseError } from '@/modules/gatekeeper/errors/license'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { getWorkspacesNonCompleteFactory } from '@/modules/workspaces/repositories/workspaces'
import { deleteWorkspacesNonCompleteFactory } from '@/modules/workspaces/services/workspaceCreationState'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { deleteSsoProviderFactory } from '@/modules/workspaces/repositories/sso'
import { deleteAllResourceInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { deleteWorkspaceFactory as repoDeleteWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { deleteWorkspaceFactory } from '@/modules/workspaces/services/management'
import { scheduleUpdateAllWorkspacesTracking } from '@/modules/workspaces/services/tracking'
import { getClient } from '@/modules/shared/utils/mixpanel'
import {
  deleteProjectAndCommitsFactory,
  queryAllProjectsFactory
} from '@/modules/core/services/projects'
import { deleteProjectFactory } from '@/modules/core/repositories/projects'
import { deleteProjectCommitsFactory } from '@/modules/core/repositories/commits'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'
import { getWorkspacePlansByWorkspaceIdFactory } from '@/modules/gatekeeper/repositories/billing'
import { countWorkspaceUsersFactory } from '@/modules/workspacesCore/repositories/workspaces'

const {
  FF_WORKSPACES_MODULE_ENABLED,
  FF_WORKSPACES_SSO_ENABLED,
  FF_BILLING_INTEGRATION_ENABLED
} = getFeatureFlags()

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
  const deleteWorkspacesNonComplete = async ({ logger }: { logger: Logger }) =>
    asMultiregionalOperation(
      ({ allDbs, mainDb, emit }) => {
        const deleteWorkspacesNonComplete = deleteWorkspacesNonCompleteFactory({
          getWorkspacesNonComplete: getWorkspacesNonCompleteFactory({ db: mainDb }),
          deleteWorkspace: deleteWorkspaceFactory({
            deleteWorkspace: replicateFactory(allDbs, repoDeleteWorkspaceFactory),
            deleteProjectAndCommits: deleteProjectAndCommitsFactory({
              deleteProject: replicateFactory(allDbs, deleteProjectFactory),
              deleteProjectCommits: replicateFactory(
                allDbs,
                deleteProjectCommitsFactory
              )
            }),
            deleteAllResourceInvites: deleteAllResourceInvitesFactory({
              db: mainDb
            }),
            queryAllProjects: queryAllProjectsFactory({
              getExplicitProjects: getExplicitProjects({ db: mainDb })
            }),
            deleteSsoProvider: deleteSsoProviderFactory({ db: mainDb }),
            countWorkspaceUsers: countWorkspaceUsersFactory({ db: mainDb }),
            getWorkspacePlansByWorkspaceId: getWorkspacePlansByWorkspaceIdFactory({
              db: mainDb
            }),
            emitWorkspaceEvent: emit
          })
        })

        return deleteWorkspacesNonComplete({ logger })
      },
      {
        logger,
        name: 'deleteWorkspacesNonComplete',
        dbs: await getAllRegisteredDbs()
      }
    )

  const every30Mins = '*/30 * * * *'
  return scheduleExecution(
    every30Mins,
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
      const mixpanel = getClient()
      const scheduleExecution = scheduleExecutionFactory({
        acquireTaskLock: acquireTaskLockFactory({ db }),
        releaseTaskLock: releaseTaskLockFactory({ db })
      })

      scheduledTasks = [scheduleDeleteWorkspacesNonComplete({ scheduleExecution })]
      if (FF_BILLING_INTEGRATION_ENABLED && mixpanel)
        scheduledTasks.push(
          scheduleUpdateAllWorkspacesTracking({ scheduleExecution, mixpanel })
        )

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

export default workspacesModule
