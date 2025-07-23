import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import restApi from '@/modules/gendo/rest/index'

const { FF_GENDOAI_MODULE_ENABLED } = getFeatureFlags()

export default {
  async init({ app }) {
    if (!FF_GENDOAI_MODULE_ENABLED) return
    moduleLogger.info('🪞 Init Gendo AI render module')

    restApi(app)
  }
} as SpeckleModule
