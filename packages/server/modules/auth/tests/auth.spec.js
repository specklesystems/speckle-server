const crs = require('crypto-random-string')
const chai = require('chai')
const request = require('supertest')

const { TIME } = require('@speckle/shared')
const { RATE_LIMITERS, createConsumer } = require('@/modules/core/services/ratelimiter')
const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { createStreamInviteDirectly } = require('@/test/speckle-helpers/inviteHelper')
const { RateLimiterMemory } = require('rate-limiter-flexible')
const {
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const { db } = require('@/db/knex')
const {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} = require('@/modules/core/services/streams/management')
const {
  inviteUsersToProjectFactory
} = require('@/modules/serverinvites/services/projectInviteManagement')
const {
  createAndSendInviteFactory
} = require('@/modules/serverinvites/services/creation')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  getStreamFactory,
  createStreamFactory
} = require('@/modules/core/repositories/streams')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory,
  legacyGetUserByEmailFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const {
  getServerInfoFactory,
  updateServerInfoFactory
} = require('@/modules/core/repositories/server')

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const createInviteDirectly = createStreamInviteDirectly
const findInvite = findInviteFactory({ db })
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
})
const getUserByEmail = legacyGetUserByEmailFactory({ db })
const updateServerInfo = updateServerInfoFactory({ db })

const expect = chai.expect

let app
let sendRequest
let server

describe('Auth @auth', () => {
  describe('Local authN & authZ (token endpoints)', () => {
    const registeredUserEmail = 'registered@speckle.systems'

    const me = {
      name: 'dimitrie stefanescu',
      company: 'speckle',
      email: registeredUserEmail,
      password: 'roll saving throws',
      id: undefined
    }

    const myPrivateStream = {
      name: 'My Private Stream 1',
      isPublic: false,
      id: undefined
    }

    before(async () => {
      const ctx = await beforeEachContext()
      server = ctx.server
      app = ctx.app
      ;({ sendRequest } = await initializeTestServer(ctx))

      // Register a user for testing login flows
      await createUser(me).then((id) => (me.id = id))

      // Create a test stream for testing stream invites
      await createStream({ ...myPrivateStream, ownerId: me.id }).then(
        (id) => (myPrivateStream.id = id)
      )
    })

    after(async () => {
      await server.close()
    })

    it('Should register a new user (speckle frontend)', async () => {
      await request(app)
        .post('/auth/local/register?challenge=test')
        .send({
          email: 'spam@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(302)
    })

    it('Should fail to register a new user w/o password (speckle frontend)', async () => {
      await request(app)
        .post('/auth/local/register?challenge=test')
        .send({ email: 'spam@speckle.systems', name: 'dimitrie stefanescu' })
        .expect(400)
    })

    const inviteTypeDataSet = [
      { display: 'stream invite', streamInvite: true, withOldStyleParam: false },
      { display: 'server invite', streamInvite: false, withOldStyleParam: false },
      {
        display: 'server invite (old style param)',
        streamInvite: false,
        withOldStyleParam: true
      }
    ]
    inviteTypeDataSet.forEach(({ display, streamInvite, withOldStyleParam }) => {
      it(`Allows registering with a ${display} in an invite-only server`, async () => {
        await updateServerInfo({ inviteOnly: true })
        const targetEmail = `invited.bunny.${streamInvite ? 'stream' : 'server'}.${
          withOldStyleParam ? 'oldparam' : 'newparam'
        }@speckle.systems`

        const inviterUser = await getUserByEmail({ email: registeredUserEmail })
        const { token, inviteId } = await createInviteDirectly(
          streamInvite
            ? {
                email: targetEmail,
                streamId: myPrivateStream.id
              }
            : {
                email: targetEmail
              },
          inviterUser.id
        )

        // No invite
        await request(app)
          .post('/auth/local/register?challenge=test')
          .send({
            email: 'spam@speckle.systems',
            name: 'dimitrie stefanescu',
            company: 'speckle',
            password: 'roll saving throws'
          })
          .expect(400)

        // Mismatched invite
        await request(app)
          .post('/auth/local/register?challenge=test&inviteId=' + inviteId)
          .send({
            email: 'spam-super@speckle.systems',
            name: 'dimitrie stefanescu',
            company: 'speckle',
            password: 'roll saving throws'
          })
          .expect(400)

        // Invalid inviteId
        await request(app)
          .post('/auth/local/register?challenge=test&inviteId=' + 'inviteId')
          .send({
            email: 'spam-super@speckle.systems',
            name: 'dimitrie stefanescu',
            company: 'speckle',
            password: 'roll saving throws'
          })
          .expect(400)

        // finally correct
        await request(app)
          .post(
            '/auth/local/register?challenge=test&' +
              (withOldStyleParam ? 'inviteId=' : 'token=') +
              token
          )
          .send({
            email: targetEmail,
            name: 'dimitrie stefanescu',
            company: 'speckle',
            password: 'roll saving throws'
          })
          .expect(302)

        // Check that user exists
        const newUser = await getUserByEmail({ email: targetEmail })
        expect(newUser).to.be.ok

        // Check that in the case of a stream invite, it remainds valid post registration
        const inviteRecord = await findInvite({ inviteId })
        if (streamInvite) {
          expect(inviteRecord).to.be.ok
        } else {
          expect(inviteRecord).to.be.not.ok
        }

        await updateServerInfo({ inviteOnly: false })
      })
    })

    it('Should log in (speckle frontend)', async () => {
      await request(app)
        .post('/auth/local/login?challenge=test')
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
    })

    it('Should fail nicely to log in (speckle frontend)', async () => {
      await request(app)
        .post('/auth/local/login?challenge=test')
        .send({ email: 'spam@speckle.systems', password: 'roll saving throw' })
        .expect(401)
    })

    it('Should redirect login with access code (speckle frontend)', async () => {
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]
      expect(accessCode).to.be.a('string')
    })

    it('Should redirect registration with access code (speckle frontend)', async () => {
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/register?challenge=${challenge}`)
        .send({
          email: 'spam_2@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]
      expect(accessCode).to.be.a('string')
    })

    it('Should exchange a token for an access code (speckle frontend)', async () => {
      const appId = 'spklwebapp'
      const appSecret = 'spklwebapp'
      const challenge = 'spklwebapp'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]

      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist
    })

    it('Should not exchange a token for an access code with a different app', async () => {
      const appId = 'sdm'
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      const accessCode = res.headers.location.split('access_code=')[1]

      // Swap the app
      await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a wrong challenge', async () => {
      const appId = 'sdm'
      const challenge = 'random'
      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      const accessCode = res.headers.location.split('access_code=')[1]

      // Spoof the challenge
      await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: 'sdm', accessCode, challenge: 'WRONG' })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a wrong secret', async () => {
      const appId = 'sdm'
      const challenge = 'random'
      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      const accessCode = res.headers.location.split('access_code=')[1]

      // Spoof the secret
      await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: 'spoof', accessCode, challenge })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a garbage input', async () => {
      const challenge = 'random'
      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      const accessCode = res.headers.location.split('access_code=')[1]

      // Send pure garbage
      await request(app).post('/auth/token').send({ accessCode, challenge }).expect(401)
    })

    it('Should refresh a token (speckle frontend)', async () => {
      const appId = 'spklwebapp'
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]

      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      const refreshTokenResponse = await request(app)
        .post('/auth/token')
        .send({
          refreshToken: tokenResponse.body.refreshToken,
          appId,
          appSecret: appId
        })
        .expect(200)

      expect(refreshTokenResponse.body.token).to.exist
      expect(refreshTokenResponse.body.refreshToken).to.exist
    })

    it('Should not refresh a token with bad juju inputs (speckle frontend)', async () => {
      const appId = 'spklwebapp'
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]

      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      // spoof secret
      await request(app)
        .post('/auth/token')
        .send({
          refreshToken: tokenResponse.body.refreshToken,
          appId,
          appSecret: 'WRONG'
        })
        .expect(401)

      // swap app (use on rt for another app)
      await request(app)
        .post('/auth/token')
        .send({
          refreshToken: tokenResponse.body.refreshToken,
          appId: 'sdm',
          appSecret: 'sdm'
        })
        .expect(401)
    })

    let frontendCredentials

    it('Should get an access code (redirected response)', async () => {
      const appId = 'spklwebapp'
      const challenge = 'random'

      const res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      const accessCode = res.headers.location.split('access_code=')[1]

      const tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      frontendCredentials = tokenResponse.body

      const response = await request(app)
        .get(
          `/auth/accesscode?appId=explorer&challenge=${crs({ length: 20 })}&token=${
            tokenResponse.body.token
          }`
        )
        .expect(302)

      expect(response.text).to.include('?access_code')
    })

    it('Should not get an access code on bad requests', async () => {
      // Spoofed app
      await request(app)
        .get(
          `/auth/accesscode?appId=lol&challenge=${crs({ length: 20 })}&token=${
            frontendCredentials.token
          }`
        )
        .expect(400)

      // Spoofed token
      await request(app)
        .get(
          `/auth/accesscode?appId=sdm&challenge=${crs({
            length: 20
          })}&token=I_AM_HACZ0R`
        )
        .expect(400)

      // No challenge
      await request(app)
        .get(`/auth/accesscode?appId=explorer&token=${frontendCredentials.token}`)
        .expect(400)
    })

    it('Should not freak out on malformed logout request', async () => {
      await request(app)
        .post('/auth/logout')
        .send({ adsfadsf: frontendCredentials.token })
        .expect(400)
    })

    it('Should invalidate tokens on logout', async () => {
      await request(app)
        .post('/auth/logout')
        .send({ ...frontendCredentials })
        .expect(200)
    })

    it('ServerInfo Query should return the auth strategies available', async () => {
      const query =
        'query sinfo { serverInfo { authStrategies { id name icon url color } } }'
      const res = await sendRequest(null, { query })
      expect(res.body.errors).to.not.exist
      expect(res.body.data.serverInfo.authStrategies).to.be.an('array')
    })

    it('Should rate-limit user creation', async () => {
      const newUser = async (id, ip, expectCode) => {
        await request(app)
          .post(`/auth/local/register?challenge=test`)
          .set('CF-Connecting-IP', ip)
          .send({
            email: `rltest_${id}@speckle.systems`,
            name: 'ratelimit test',
            company: 'test',
            password: 'roll saving throws'
          })
          .expect(expectCode)
      }

      const oldRateLimiter = RATE_LIMITERS.USER_CREATE

      RATE_LIMITERS.USER_CREATE = createConsumer(
        'USER_CREATE',
        new RateLimiterMemory({
          keyPrefix: 'USER_CREATE',
          points: 1,
          duration: 1 * TIME.week
        })
      )

      const oldNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'temporarily-disabled-test'

      // 1 users should be fine
      await newUser(`test0`, '1.2.3.4', 302)

      // should fail the next user
      await newUser(`test1`, '1.2.3.4', 429)

      // should be able to create from different ip
      await newUser(`othertest0`, '1.2.3.5', 302)

      // should be limited from unknown ip addresses
      await newUser(`unknown0`, '', 302)

      // should fail the additional user from unknown ip address
      await newUser(`unknown1`, '', 429)

      RATE_LIMITERS.USER_CREATE = oldRateLimiter
      process.env.NODE_ENV = oldNodeEnv
    })
  })
})
