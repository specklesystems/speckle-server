import {
  localAuthRestApi,
  LocalAuthRestApiHelpers
} from '@/modules/auth/tests/helpers/registration'
import { beforeEachContext } from '@/test/hooks'
import type { Express } from 'express'

describe('Server registration', () => {
  let restApi: LocalAuthRestApiHelpers

  before(async () => {
    const ctx = await beforeEachContext()
    restApi = localAuthRestApi({ express: ctx.app })
  })

  describe('with local strategy (email/pw)', () => {
    it('works', async () => {
      // TODO
    })
  })
})
