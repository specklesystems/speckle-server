import { moduleLogger } from '@/logging/logging'
import { getRegionClients } from '@/modules/multiregion/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const multiRegion: SpeckleModule = {
  async init() {
    const isEnabled = isMultiRegionEnabled()
    if (!isEnabled) {
      return
    }

    moduleLogger.info('🌍 Init multiRegion module')
    // this should have all the builtin checks to make sure all regions are working
    // and no regions are missing
    const regionClients = await getRegionClients()
    moduleLogger.info('Migrating region databases')
    await Promise.all(Object.values(regionClients).map((db) => db.migrate.latest()))
    moduleLogger.info('Migrations done')
  }
}

export default multiRegion
