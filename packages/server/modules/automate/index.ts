import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { ENABLE_AUTOMATE_MODULE } from '@/modules/shared/helpers/envHelper'
import authRestSetup from '@/modules/automate/rest/auth'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { Scopes } from '@speckle/shared'
import { registerOrUpdateScope } from '@/modules/shared'

async function initScopes() {
  const scopes: ScopeRecord[] = [
    {
      name: Scopes.Automate.ReportResults,
      description: 'Report automation results to the server.',
      public: true
    },
    {
      name: Scopes.AutomateFunctions.Read,
      description: 'See available Speckle Automate functions.',
      public: true
    },
    {
      name: Scopes.AutomateFunctions.Write,
      description: 'Create and manage Speckle Automate functions.',
      public: true
    }
  ]

  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }
}

const automateModule: SpeckleModule = {
  async init(app, isInitial) {
    if (!ENABLE_AUTOMATE_MODULE) return
    moduleLogger.info('⚙️  Init automate module')

    await initScopes()

    if (isInitial) {
      authRestSetup(app)
    }
  }
}

export = automateModule
