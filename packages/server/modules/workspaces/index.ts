import { moduleLogger } from '@/logging/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'
import { initializeEventListenersFactory } from '@/modules/workspaces/events/eventListener'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const initScopes = () => {
  const registerFunc = registerOrUpdateScopeFactory({ db })
  return Promise.all(workspaceScopes.map((scope) => registerFunc({ scope })))
}

const initRoles = () => {
  const registerFunc = registerOrUpdateRole({ db })
  return Promise.all(workspaceRoles.map((role) => registerFunc({ role })))
}

const workspacesModule: SpeckleModule = {
  async init(_, isInitial) {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    moduleLogger.info('⚒️  Init workspaces module')
    if (isInitial) {
      initializeEventListenersFactory({ db })()
    }
    await Promise.all([initScopes(), initRoles()])
  }
}

export = workspacesModule
