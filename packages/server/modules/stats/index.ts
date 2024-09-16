import { moduleLogger } from '@/logging/logging'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

export const init: SpeckleModule['init'] = async () => {
  moduleLogger.info('📊 Init stats module')
}
