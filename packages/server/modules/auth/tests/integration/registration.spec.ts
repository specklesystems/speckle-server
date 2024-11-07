import { db } from '@/db/knex'
import {
  generateRegistrationParams,
  localAuthRestApi,
  LocalAuthRestApiHelpers,
  LoginParams
} from '@/modules/auth/tests/helpers/registration'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { updateServerInfoFactory } from '@/modules/core/repositories/server'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateProjectInviteDocument,
  CreateProjectInviteMutationVariables,
  CreateServerInviteDocument,
  CreateServerInviteMutationVariables,
  UseStreamInviteDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import { captureCreatedInvite } from '@/test/speckle-helpers/inviteHelper'
import {
  BasicTestStream,
  createTestStreams,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

const updateServerInfo = updateServerInfoFactory({ db })

describe('Server registration', () => {
  let restApi: LocalAuthRestApiHelpers
  let apollo: TestApolloServer

  const createInviteAsAdmin = async (
    args: CreateProjectInviteMutationVariables | CreateServerInviteMutationVariables
  ) => {
    return await captureCreatedInvite(async () => {
      if ('projectId' in args) {
        await apollo.execute(CreateProjectInviteDocument, args, {
          assertNoErrors: true
        })
      } else {
        await apollo.execute(CreateServerInviteDocument, args, {
          assertNoErrors: true
        })
      }
    })
  }

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

    apollo = await testApolloServer({
      authUserId: basicAdminUser.id
    })
  })

  afterEach(() => {
    EmailSendingServiceMock.resetMockedFunctions()
  })

  describe('with local strategy (email/pw)', () => {
    it('works', async () => {
      const challenge = 'asd123'
      const params = generateRegistrationParams()
      params.challenge = challenge

      const user = await restApi.register(params)

      // email remains unverified
      expect(user.emails.every((e) => !e.verified)).to.be.true
    })

    it('fails without challenge', async () => {
      const params = generateRegistrationParams()
      params.challenge = ''

      const e = await expectToThrow(async () => await restApi.register(params))
      expect(e.message).to.contain('no challenge detected')
    })

    itEach(
      <const>[
        { key: 'email', msg: 'E-mail address is required' },
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

      const invite = await createInviteAsAdmin({
        input: {
          email: params.user.email,
          serverRole: Roles.Server.Admin
        },
        projectId: basicAdminStream.id
      })
      expect(invite.token).to.be.ok

      params.inviteToken = invite.token

      const newUser = await restApi.register(params)
      expect(newUser.role).to.equal(Roles.Server.Admin)

      const res = await apollo.execute(
        UseStreamInviteDocument,
        {
          accept: true,
          token: invite.token,
          streamId: basicAdminStream.id
        },
        {
          context: await createTestContext({
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
      expect(await findInviteFactory({ db })({ inviteId: invite.id })).to.be.not.ok

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
            `works with valid ${
              stream ? 'stream' : 'server'
            } invite token and auto-verifies email`,
          async ({ stream }) => {
            const challenge = 'bababooey'
            const params = generateRegistrationParams()
            params.challenge = challenge

            const invite = await createInviteAsAdmin({
              input: {
                email: params.user.email,
                serverRole: Roles.Server.Admin
              },
              ...(stream ? { projectId: basicAdminStream.id } : {})
            })
            expect(invite.token).to.be.ok

            params.inviteToken = invite.token

            const newUser = await restApi.register(params)
            expect(newUser.role).to.equal(Roles.Server.Admin)
            expect(newUser.emails.every((e) => e.verified)).to.be.true
          }
        )
      })
    })

    describe('when logging in', () => {
      const registeredUserParams = generateRegistrationParams()

      before(async () => {
        await restApi.register(registeredUserParams)
      })

      it('works with valid credentials', async () => {
        const challenge = 'asd123asdasd'

        const loginParams: LoginParams = {
          email: registeredUserParams.user.email,
          password: registeredUserParams.user.password,
          challenge
        }

        await restApi.login(loginParams)
      })

      it("doesn't work with invalid challenge for 2nd call", async () => {
        const challenge = 'asd123asdasd'

        const loginParams: LoginParams = {
          email: registeredUserParams.user.email,
          password: registeredUserParams.user.password,
          challenge
        }

        const e = await expectToThrow(async () => {
          await restApi.login(loginParams, {
            getTokenFromAccessCodeChallenge: 'mismatched'
          })
        })
        expect(e.message).to.contain('Invalid request')
      })

      it("doesn't work with invalid credentials", async () => {
        const challenge = 'asd123asdasd'

        const loginParams: LoginParams = {
          email: registeredUserParams.user.email,
          password: 'wrongpassword',
          challenge
        }

        const e = await expectToThrow(async () => await restApi.login(loginParams))
        expect(e.message).to.contain('Invalid credentials')
      })
    })
  })
})
