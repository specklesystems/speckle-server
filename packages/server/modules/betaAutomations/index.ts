import { moduleLogger } from '@/logging/logging'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { registerOrUpdateScope } from '@/modules/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { Scopes } from '@speckle/shared'

async function initScopes() {
  const scopes: ScopeRecord[] = [
    {
      name: Scopes.Automate.ReportResults,
      description: 'Report automation results to the server.',
      public: true
    }
  ]

  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }
}

const automationModule: SpeckleModule = {
  async init() {
    moduleLogger.info('🤖 Init BETA automate module')
    await initScopes()
  }
}

export = automationModule
