import { db } from '@/db/knex'
import {
  generateRegistrationParams,
  localAuthRestApi,
  LocalAuthRestApiHelpers
} from '@/modules/auth/tests/helpers/registration'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { updateServerInfo } from '@/modules/core/services/generic'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { UseStreamInviteDocument } from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  createServerInviteDirectly,
  createStreamInviteDirectly
} from '@/test/speckle-helpers/inviteHelper'
import {
  BasicTestStream,
  createTestStreams,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Server registration', () => {
  let restApi: LocalAuthRestApiHelpers
  let apollo: TestApolloServer

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
    apollo = await testApolloServer({
      authUserId: basicAdminUser.id
    })

    await createTestUsers([basicAdminUser])
    await createTestStreams([[basicAdminStream, basicAdminUser]])
  })

  describe('with local strategy (email/pw)', () => {
    it('works', async () => {
      const challenge = 'asd123'
      const params = generateRegistrationParams()
      params.challenge = challenge

      await restApi.register(params)
    })

    it('fails without challenge', async () => {
      const params = generateRegistrationParams()
      params.challenge = ''

      const e = await expectToThrow(async () => await restApi.register(params))
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

        const e = await expectToThrow(async () => await restApi.register(params))
        expect(e.message).to.contain(msg)
      }
    )

    it('fails with invalid invite token', async () => {
      const params = generateRegistrationParams()
      params.inviteToken = 'bababa'

      const e = await expectToThrow(async () => await restApi.register(params))
      expect(e.message).to.contain('Wrong e-mail address or invite token')
    })

    it('fails with mismatched challenge', async () => {
      const params = generateRegistrationParams()

      const e = await expectToThrow(
        async () =>
          await restApi.register(params, {
            getTokenFromAccessCodeChallenge: 'mismatched'
          })
      )
      expect(e.message).to.contain('Invalid request')
    })

    it('works with stream invite and allows joining stream afterwards', async () => {
      const params = generateRegistrationParams()

      const invite = await createStreamInviteDirectly(
        {
          email: params.user.email,
          stream: basicAdminStream
        },
        basicAdminUser.id
      )
      expect(invite.token).to.be.ok

      params.inviteToken = invite.token

      const newUser = await restApi.register(params)

      const res = await apollo.execute(
        UseStreamInviteDocument,
        {
          accept: true,
          token: invite.token,
          streamId: basicAdminStream.id
        },
        {
          context: createTestContext({
            userId: newUser.id,
            auth: true,
            role: Roles.Server.User,
            token: 'asd',
            scopes: AllScopes
          })
        }
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.streamInviteUse).to.be.ok
      expect(await findInviteFactory({ db })({ inviteId: invite.inviteId })).to.be.not
        .ok

      const userStreamRole = await getUserStreamRole(newUser.id, basicAdminStream.id)
      expect(userStreamRole).to.be.ok
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

            const e = await expectToThrow(async () => await restApi.register(params))
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

            await restApi.register(params)
          }
        )
      })
    })
  })
})
