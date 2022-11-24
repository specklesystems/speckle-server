const crs = require('crypto-random-string')
const chai = require('chai')
const request = require('supertest')
const { createUser } = require('@/modules/core/services/users')
const { createStream } = require('@/modules/core/services/streams')

const { updateServerInfo } = require('@/modules/core/services/generic')
const { getUserByEmail } = require('@/modules/core/services/users')
const { TIME } = require('@speckle/shared')
const {
  RATE_LIMITERS,
  createConsumer,
  RateLimitAction
} = require('@/modules/core/services/ratelimiter')
const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { createInviteDirectly } = require('@/test/speckle-helpers/inviteHelper')
const { getInvite } = require('@/modules/serverinvites/repositories')
const { RateLimiterMemory } = require('rate-limiter-flexible')

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
      ;({ app, server } = await beforeEachContext())
      ;({ sendRequest } = await initializeTestServer(server, app))

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
        const inviteRecord = await getInvite(inviteId)
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
        RateLimitAction.USER_CREATE,
        new RateLimiterMemory({
          keyPrefix: RateLimitAction.USER_CREATE,
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
