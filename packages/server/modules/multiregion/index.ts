import { moduleLogger } from '@/logging/logging'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const multiregion: SpeckleModule = {
  init() {
    const isEnabled = isMultiRegionEnabled()
    if (isEnabled) {
      moduleLogger.info('🌍 Init multiregion module')
    }
  }
}

export default multiregion
