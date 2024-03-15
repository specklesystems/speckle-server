import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { ENABLE_AUTOMATE_MODULE } from '../shared/helpers/envHelper'

const automateModule: SpeckleModule = {
  async init() {
    if (!ENABLE_AUTOMATE_MODULE) return
    moduleLogger.info('⚙️ Init automate module')
  }
}

export = automateModule
