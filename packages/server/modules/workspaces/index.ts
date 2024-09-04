import { moduleLogger } from '@/logging/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import {
  initializeEventListenersFactory,
  onInviteFinalizedFactory,
  onProjectCreatedFactory,
  onWorkspaceJoinedFactory
} from '@/modules/workspaces/events/eventListener'
import {
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  deleteProjectRoleFactory,
  getStream,
  upsertProjectRoleFactory
} from '@/modules/core/repositories/streams'
import { updateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getStreams } from '@/modules/core/services/streams'
import { findVerifiedEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'
import { validateModuleLicense } from '@/modules/gatekeeper/services/validateLicense'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { mapWorkspaceRoleToInitialProjectRole } from '@/modules/workspaces/domain/logic'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

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
  async init(_, isInitial) {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    const isWorkspaceLicenseValid = await validateModuleLicense({
      requiredModules: ['workspaces']
    })

    if (!isWorkspaceLicenseValid)
      throw new Error(
        'The workspaces module needs a valid license to run, contact Speckle to get one.'
      )
    moduleLogger.info('⚒️  Init workspaces module')

    if (isInitial) {
      quitListeners = initializeEventListenersFactory({
        onProjectCreated: onProjectCreatedFactory({
          getDefaultWorkspaceProjectRoleMapping: mapWorkspaceRoleToInitialProjectRole,
          upsertProjectRole: upsertProjectRoleFactory({ db }),
          getWorkspaceRoles: getWorkspaceRolesFactory({ db })
        }),
        onWorkspaceJoined: onWorkspaceJoinedFactory({
          getDefaultWorkspaceProjectRoleMapping: mapWorkspaceRoleToInitialProjectRole,
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          upsertProjectRole: upsertProjectRoleFactory({ db })
        }),
        onInviteFinalized: onInviteFinalizedFactory({
          getStream,
          logger: moduleLogger,
          updateWorkspaceRole: updateWorkspaceRoleFactory({
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
            findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
            getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            getDefaultWorkspaceProjectRoleMapping: mapWorkspaceRoleToInitialProjectRole,
            upsertProjectRole: upsertProjectRoleFactory({ db }),
            deleteProjectRole: deleteProjectRoleFactory({ db }),
            queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
            emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
          })
        })
      })()
    }
    await Promise.all([initScopes(), initRoles()])
  },
  shutdown() {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    quitListeners?.()
  }
}

export = workspacesModule
