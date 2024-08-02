import {
  localAuthRestApi,
  LocalAuthRestApiHelpers,
  RegisterParams
} from '@/modules/auth/tests/helpers/registration'
import { updateServerInfo } from '@/modules/core/services/generic'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  createServerInviteDirectly,
  createStreamInviteDirectly
} from '@/test/speckle-helpers/inviteHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { faker } from '@faker-js/faker'
import { expect } from 'chai'
import { random } from 'lodash'

describe('Server registration', () => {
  let restApi: LocalAuthRestApiHelpers
  const basicAdminUser: BasicTestUser = {
    name: 'Some Admin Guy',
    email: 'admindude123@asdasd.com',
    id: ''
  }
  const basicAdminStream: BasicTestStream = {
    name: 'Admin Stream',
    description: 'Admin Stream Description',
    isPublic: true,
    ownerId: '',
    id: ''
  }

  before(async () => {
    const ctx = await beforeEachContext()
    restApi = localAuthRestApi({ express: ctx.app })

    await createTestUsers([basicAdminUser])
    await createTestStreams([[basicAdminStream, basicAdminUser]])
  })

  describe('with local strategy (email/pw)', () => {
    const generateRegistrationParams = (): RegisterParams => ({
      challenge: faker.string.uuid(),
      user: {
        email: (random(0, 1000) + faker.internet.email()).toLowerCase(),
        password: faker.internet.password(),
        name: faker.person.fullName()
      }
    })

    const register = async (
      params: RegisterParams,
      options?: Partial<{
        /**
         * In case you want the challenge in the 2nd call to be different
         */
        getTokenFromAccessCodeChallenge: string
      }>
    ) => {
      const accessCode = await restApi.registerAndGetAccessCode(params)
      expect(accessCode).to.be.ok

      const token = await restApi.getTokenFromAccessCode({
        accessCode,
        challenge: options?.getTokenFromAccessCodeChallenge ?? params.challenge
      })
      expect(token).to.be.ok

      const user = await restApi.authCheck({ token })
      expect(user).to.be.ok
      expect(user.email).to.equal(params.user.email)
      expect(user.name).to.equal(params.user.name)

      return params
    }

    it('works', async () => {
      const challenge = 'asd123'
      const params = generateRegistrationParams()
      params.challenge = challenge

      await register(params)
    })

    it('fails without challenge', async () => {
      const params = generateRegistrationParams()
      params.challenge = ''

      const e = await expectToThrow(async () => await register(params))
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

        const e = await expectToThrow(async () => await register(params))
        expect(e.message).to.contain(msg)
      }
    )

    it('fails with invalid invite token', async () => {
      const params = generateRegistrationParams()
      params.inviteToken = 'bababa'

      const e = await expectToThrow(async () => await register(params))
      expect(e.message).to.contain('Wrong e-mail address or invite token')
    })

    it('fails with mismatched challenge', async () => {
      const params = generateRegistrationParams()

      const e = await expectToThrow(
        async () =>
          await register(params, { getTokenFromAccessCodeChallenge: 'mismatched' })
      )
      expect(e.message).to.contain('Invalid request')
    })

    const inviteOnlyModeSettings = [{ inviteOnly: true }, { inviteOnly: false }]

    inviteOnlyModeSettings.forEach(({ inviteOnly }) => {
      describe(`with inviteOnly mode ${inviteOnly ? 'enabled' : 'disabled'}`, () => {
        before(async () => {
          await updateServerInfo({ inviteOnly })
        })

        after(async () => {
          await updateServerInfo({ inviteOnly: false })
        })

        if (inviteOnly) {
          it('fails without invite token', async () => {
            const params = generateRegistrationParams()

            const e = await expectToThrow(async () => await register(params))
            expect(e.message).to.contain('This server is invite only')
          })
        }

        itEach(
          [{ stream: true }, { stream: false }],
          ({ stream }) =>
            `works with valid ${stream ? 'stream' : 'server'} invite token`,
          async ({ stream }) => {
            const challenge = 'bababooey'
            const params = generateRegistrationParams()
            params.challenge = challenge

            const invite = stream
              ? await createStreamInviteDirectly(
                  {
                    email: params.user.email,
                    stream: basicAdminStream
                  },
                  basicAdminUser.id
                )
              : await createServerInviteDirectly(
                  { email: params.user.email },
                  basicAdminUser.id
                )
            expect(invite.token).to.be.ok

            params.inviteToken = invite.token

            await register(params)
          }
        )
      })
    })
  })
})
