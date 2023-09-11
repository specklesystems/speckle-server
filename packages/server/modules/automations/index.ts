import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const automationModule: SpeckleModule = {
  init() {
    moduleLogger.info('🤖 Init automations module')
  }
}

export = automationModule
