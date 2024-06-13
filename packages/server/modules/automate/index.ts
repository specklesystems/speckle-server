import { moduleLogger } from '@/logging/logging'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { VersionEvents, VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  onModelVersionCreate,
  triggerAutomationRevisionRun
} from '@/modules/automate/services/trigger'
import {
  getActiveTriggerDefinitions,
  getAutomationRunFullTriggers,
  getFullAutomationRevisionMetadata,
  getAutomation,
  getAutomationRevision
} from '@/modules/automate/repositories/automations'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { Scopes } from '@speckle/shared'
import { registerOrUpdateScope } from '@/modules/shared'
import { triggerAutomationRun } from '@/modules/automate/clients/executionEngine'
import logStreamRest from '@/modules/automate/rest/logStream'
import {
  getEncryptionKeyPairFor,
  getFunctionInputDecryptor
} from '@/modules/automate/services/encryption'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import {
  setupAutomationUpdateSubscriptions,
  setupStatusUpdateSubscriptions
} from '@/modules/automate/services/subscriptions'
import { setupRunFinishedTracking } from '@/modules/automate/services/tracking'
import authGithubAppRest from '@/modules/automate/rest/authGithubApp'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()
let quitListeners: Optional<() => void> = undefined

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
    automateRunTrigger: triggerAutomationRun,
    getEncryptionKeyPairFor,
    getFunctionInputDecryptor: getFunctionInputDecryptor({
      buildDecryptor
    })
  })
  const setupStatusUpdateSubscriptionsInvoke = setupStatusUpdateSubscriptions({
    getAutomationRunFullTriggers
  })
  const setupAutomationUpdateSubscriptionsInvoke = setupAutomationUpdateSubscriptions()
  const setupRunFinishedTrackingInvoke = setupRunFinishedTracking({
    getFullAutomationRevisionMetadata
  })

  const quitters = [
    VersionsEmitter.listen(
      VersionEvents.Created,
      async ({ modelId, version, projectId }) => {
        await onModelVersionCreate({
          getAutomation,
          getAutomationRevision,
          getTriggers: getActiveTriggerDefinitions,
          triggerFunction: triggerFn
        })({ modelId, versionId: version.id, projectId })
      }
    ),
    setupStatusUpdateSubscriptionsInvoke(),
    setupAutomationUpdateSubscriptionsInvoke(),
    setupRunFinishedTrackingInvoke()
  ]

  return () => {
    quitters.forEach((quit) => quit())
  }
}

const automateModule: SpeckleModule = {
  async init(app, isInitial) {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    moduleLogger.info('⚙️  Init automate module')

    await initScopes()
    logStreamRest(app)
    authGithubAppRest(app)

    if (isInitial) {
      quitListeners = initializeEventListeners()
    }
  },
  shutdown() {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    quitListeners?.()
  }
}

export = automateModule
