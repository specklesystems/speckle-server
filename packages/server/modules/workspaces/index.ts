import { moduleLogger } from '@/logging/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import { initializeEventListenersFactory } from '@/modules/workspaces/events/eventListener'
import {
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import { getStream, grantStreamPermissions } from '@/modules/core/repositories/streams'
import { updateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getStreams } from '@/modules/core/services/streams'
import { findVerifiedEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

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
    moduleLogger.info('⚒️  Init workspaces module')

    if (isInitial) {
      initializeEventListenersFactory({
        getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
        grantStreamPermissions,
        getStream,
        logger: moduleLogger,
        updateWorkspaceRole: updateWorkspaceRoleFactory({
          getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
          findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
          getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
          upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
          emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
          getStreams,
          grantStreamPermissions
        })
      })()
    }
    await Promise.all([initScopes(), initRoles()])
  }
}

export = workspacesModule
