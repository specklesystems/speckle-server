import { moduleLogger } from '@/logging/logging'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { getAvailableRegionConfigsFactory } from '@/modules/multiregion/services/config'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const multiregion: SpeckleModule = {
  async init() {
    const isEnabled = isMultiRegionEnabled()
    if (!isEnabled) {
      return
    }

    moduleLogger.info('🌍 Init multiregion module')

    // Test config
    await getAvailableRegionConfigsFactory()()
  }
}

export default multiregion
