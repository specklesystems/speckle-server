import { moduleLogger } from '@/logging/logging'
import RestSetup from '@/modules/pwdreset/rest'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { noop } from 'lodash'

export const init: SpeckleModule['init'] = ({ app, openApiDocument }) => {
  moduleLogger.info('♻️  Init pwd reset module')
  RestSetup({ app, openApiDocument })
}

export const finalize: SpeckleModule['finalize'] = noop
