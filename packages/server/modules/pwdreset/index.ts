import { moduleLogger } from '@/observability/logging'
import RestSetup from '@/modules/pwdreset/rest'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { noop } from 'lodash-es'

export const init: SpeckleModule['init'] = ({ app }) => {
  moduleLogger.info('♻️  Init pwd reset module')
  RestSetup(app)
}

export const finalize: SpeckleModule['finalize'] = noop
