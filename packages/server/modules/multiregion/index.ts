import { moduleLogger } from '@/logging/logging'
import { initializeRegisteredRegionClients } from '@/modules/multiregion/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const multiRegion: SpeckleModule = {
  async init() {
    const isEnabled = isMultiRegionEnabled()
    if (!isEnabled) {
      return
    }

    moduleLogger.info('🌍 Init multiRegion module')

    // Init registered region clients
    await initializeRegisteredRegionClients()
  }
}

export default multiRegion
