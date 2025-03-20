import { moduleLogger } from '@/observability/logging'
import {
  getValidDefaultProjectRegionKey,
  initializeRegisteredRegionClients as initDb
} from '@/modules/multiregion/utils/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import {
  initializeRegisteredRegionClients as initBlobs,
  isMultiRegionBlobStorageEnabled
} from '@/modules/multiregion/utils/blobStorageSelector'
import {
  initializeQueue,
  shutdownQueue,
  startQueue
} from '@/modules/multiregion/services/queue'

const multiRegion: SpeckleModule = {
  async init({ isInitial }) {
    const isEnabled = isMultiRegionEnabled()
    if (!isEnabled) {
      return
    }

    moduleLogger.info('🌍 Init multiRegion module')

    // Init registered region clients
    await initDb()
    // validate default project region key
    await getValidDefaultProjectRegionKey()

    const isBlobStorageEnabled = isMultiRegionBlobStorageEnabled()
    if (isBlobStorageEnabled) {
      moduleLogger.info('🌍 Init multiRegion blob storage')
      await initBlobs()
    }

    if (isInitial) {
      await initializeQueue()
      await startQueue()
    }
  },
  async shutdown() {
    await shutdownQueue()
  }
}

export default multiRegion
