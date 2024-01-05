'use strict'
import { moduleLogger } from '@/logging/logging'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

export = {
  init: async () => {
    moduleLogger.info('📊 Init stats module')
    // TODO
  },

  finalize: async () => {
    // TODO
  }
} as SpeckleModule
