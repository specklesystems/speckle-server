import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/observability/logging'

export const init: SpeckleModule['init'] = () => {
  moduleLogger.info('⚒️  Init gatekeeper core module')
}
