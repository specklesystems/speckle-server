import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/logging/logging'

export = {
  async init() {
    moduleLogger.info('🪞 Init Gendo AI render module')
    // TODO
  },
  async shutdown() {
    // TODO
  }
} as SpeckleModule
