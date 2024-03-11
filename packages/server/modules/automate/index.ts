import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const automateModule: SpeckleModule = {
  async init() {
    moduleLogger.info('⚙️ Init automate module')
  }
}

export = automateModule
