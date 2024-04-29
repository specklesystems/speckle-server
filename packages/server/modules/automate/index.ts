import { moduleLogger, logger, extendLoggerComponent } from '@/logging/logging'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { VersionEvents, VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  onModelVersionCreate,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import { Environment } from '@speckle/shared'
import { getActiveTriggerDefinitions } from '@/modules/automate/repositories/automations'
import authRestSetup from '@/modules/automate/rest/auth'
import createFunctionReleaseRestSetup from '@/modules/automate/rest/createFunctionRelease'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { Scopes } from '@speckle/shared'
import { registerOrUpdateScope } from '@/modules/shared'
import pino from 'pino'
import { triggerAutomationRun } from '@/modules/automate/clients/executionEngine'

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()
let quitListeners: Optional<() => void> = undefined
let customLogger: Optional<typeof logger> = undefined

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

const initializeEventListeners = () => {
  const triggerFn = triggerAutomationRevisionRun({
    automateRunTrigger: triggerAutomationRun
  })

  const quit = VersionsEmitter.listen(
    VersionEvents.Created,
    async ({ modelId, version }) => {
      await onModelVersionCreate({
        getTriggers: getActiveTriggerDefinitions,
        triggerFunction: triggerFn
      })({ modelId, versionId: version.id })
    }
  )

  return quit
}

const automateModule: SpeckleModule<{
  /**
   * Get Automate module logger
   */
  getLogger: () => pino.Logger
}> = {
  async init(app, isInitial) {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    moduleLogger.info('⚙️  Init automate module')

    await initScopes()

    authRestSetup(app)
    createFunctionReleaseRestSetup(app)

    if (isInitial) {
      quitListeners = initializeEventListeners()
    }
  },
  shutdown() {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    quitListeners?.()
  },
  getLogger() {
    if (!customLogger) {
      customLogger = extendLoggerComponent(logger, 'automate')
    }

    return customLogger
  }
}

export = automateModule
