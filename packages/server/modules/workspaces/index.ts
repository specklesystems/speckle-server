import { moduleLogger } from '@/logging/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { registerOrUpdateScope } from '@/modules/shared/repositories/scopes'
import db from '@/db/knex'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { workspaceRoles } from '@/modules/workspaces/roles'
import { workspaceScopes } from '@/modules/workspaces/scopes'
import { registerOrUpdateRole } from '@/modules/shared/repositories/roles'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

const initScopes = () => {
  const registerFunc = registerOrUpdateScope({ db })
  return Promise.all(workspaceScopes.map((scope) => registerFunc({ scope })))
}

const initRoles = () => {
  const registerFunc = registerOrUpdateRole({ db })
  return Promise.all(workspaceRoles.map((role) => registerFunc({ role })))
}

const workspacesModule: SpeckleModule = {
  async init() {
    if (!FF_WORKSPACES_MODULE_ENABLED) return
    moduleLogger.info('⚒️  Init workspaces module')

    await initScopes()
    await initRoles()
  }
}

export = workspacesModule
