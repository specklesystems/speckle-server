import { moduleLogger } from '@/logging/logging'
import { initializeRegisteredRegionClients as initDb } from '@/modules/multiregion/utils/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  initializeRegisteredRegionClients as initBlobs,
  isMultiRegionBlobStorageEnabled
} from '@/modules/multiregion/utils/blobStorageSelector'

const multiRegion: SpeckleModule = {
  async init() {
    const isEnabled = isMultiRegionEnabled()
    if (!isEnabled) {
      return
    }

    moduleLogger.info('🌍 Init multiRegion module')

    // Init registered region clients
    await initDb()

    const isBlobStorageEnabled = isMultiRegionBlobStorageEnabled()
    if (isBlobStorageEnabled) {
      moduleLogger.info('🌍 Init multiRegion blob storage')
      await initBlobs()
    }
  }
}

export default multiRegion
