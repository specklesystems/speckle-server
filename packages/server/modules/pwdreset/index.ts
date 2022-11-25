import RestSetup from '@/modules/pwdreset/rest'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import debug from 'debug'
import { noop } from 'lodash'

export const init: SpeckleModule['init'] = (app) => {
  debug('speckle:modules')('♻️  Init pwd reset module')
  RestSetup(app)
}

export const finalize: SpeckleModule['finalize'] = noop
