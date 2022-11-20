import { moduleLogger } from '@/logging/logging'
import RestSetup from '@/modules/pwdreset/rest'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { noop } from 'lodash'

export const init: SpeckleModule['init'] = (app) => {
  moduleLogger.info('♻️  Init pwd reset module')
  RestSetup(app)
}

export const finalize: SpeckleModule['finalize'] = noop
