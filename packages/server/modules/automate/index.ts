import { moduleLogger } from '@/logging/logging'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { VersionEvents, VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  onModelVersionCreate,
  triggerAutomationRevisionRun,
  sendRunTriggerToAutomate
} from '@/modules/automate/services/trigger'
import { Environment } from '@speckle/shared'
import { queryActiveTriggersByTriggeringId } from './repositories'

let quitListeners: Optional<() => void> = undefined

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

const automateModule: SpeckleModule = {
  async init(_, isInitial) {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    moduleLogger.info('⚙️  Init automate module')

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

const initializeEventListeners = () => {
  const triggerFn = triggerAutomationRevisionRun(sendRunTriggerToAutomate)
  const quit = VersionsEmitter.listen(
    VersionEvents.Created,
    async ({ modelId, version }) => {
      await onModelVersionCreate(
        queryActiveTriggersByTriggeringId,
        triggerFn
      )({ modelId, versionId: version.id })
    }
  )
  return quit
}
