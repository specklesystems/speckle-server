import {
  localAuthRestApi,
  LocalAuthRestApiHelpers,
  RegisterParams
} from '@/modules/auth/tests/helpers/registration'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { beforeEachContext } from '@/test/hooks'
import { faker } from '@faker-js/faker'
import { expect } from 'chai'
import { random } from 'lodash'

describe('Server registration', () => {
  let restApi: LocalAuthRestApiHelpers

  before(async () => {
    const ctx = await beforeEachContext()
    restApi = localAuthRestApi({ express: ctx.app })
  })

  describe('with local strategy (email/pw)', () => {
    const generateRegistrationParams = (): RegisterParams => ({
      challenge: faker.string.uuid(),
      user: {
        email: random(0, 1000) + faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName()
      }
    })

    it('works', async () => {
      const challenge = 'asd123'
      const params = generateRegistrationParams()

      const accessCode = await restApi.registerAndGetAccessCode(params)
      expect(accessCode).to.be.ok

      const token = await restApi.getTokenFromAccessCode({
        accessCode,
        challenge
      })
      expect(token).to.be.ok

      const user = await restApi.authCheck({ token })
      expect(user).to.be.ok
      expect(user.email).to.equal(params.user.email)
      expect(user.name).to.equal(params.user.name)
    })

    it('fails without challenge', async () => {
      const params = generateRegistrationParams()
      params.challenge = ''

      const e = await expectToThrow(
        async () => await restApi.registerAndGetAccessCode(params)
      )
      expect(e.message).to.contain('no challenge detected')
    })

    itEach(
      <const>[
        { key: 'email', msg: 'E-mail address is empty' },
        { key: 'name', msg: 'User name is required' },
        { key: 'password', msg: 'Password missing' }
      ],
      ({ key }) => `fails with empty ${key}`,
      async ({ key, msg }) => {
        const params = generateRegistrationParams()
        params.user[key] = ''

        const e = await expectToThrow(
          async () => await restApi.registerAndGetAccessCode(params)
        )
        expect(e.message).to.contain(msg)
      }
    )
  })
})
