import { moduleLogger } from '@/logging/logging'
import { TokenScopeData } from '@/modules/shared/domain/rolesAndScopes/types'
import { registerOrUpdateScope } from '@/modules/shared/repositories/scopes'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { Scopes } from '@speckle/shared'
import db from '@/db/knex'

async function initScopes() {
  const scopes: TokenScopeData[] = [
    {
      name: Scopes.Automate.ReportResults,
      description: 'Report automation results to the server.',
      public: true
    }
  ]

  const registerFunc = registerOrUpdateScope({ db })
  for (const scope of scopes) {
    await registerFunc({ scope })
  }
}

const automationModule: SpeckleModule = {
  async init() {
    moduleLogger.info('🤖 Init BETA automate module')
    await initScopes()
  }
}

export = automationModule
