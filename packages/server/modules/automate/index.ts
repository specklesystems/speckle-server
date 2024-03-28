import { moduleLogger } from '@/logging/logging'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { VersionEvents, VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import { onModelVersionCreate } from '@/modules/automate/services/trigger'
import { Environment } from '@speckle/shared'

let quitListeners: Optional<() => void> = undefined

const { FF_AUTOMATE_MODULE_ENABLED } = Environment.getFeatureFlags()

const automateModule: SpeckleModule = {
  async init(_, isInitial) {
    if (!FF_AUTOMATE_MODULE_ENABLED) return
    moduleLogger.info('⚙️ Init automate module')

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
  const quit = VersionsEmitter.listen(
    VersionEvents.Created,
    async ({ modelId, version }) => {
      await onModelVersionCreate({ modelId, versionId: version.id })
    }
  )
  return quit
}
