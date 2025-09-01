import crs from 'crypto-random-string'
import chai from 'chai'
import request from 'supertest'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { createStreamInviteDirectly } from '@/test/speckle-helpers/inviteHelper'
import { db } from '@/db/knex'
import { legacyGetUserByEmailFactory } from '@/modules/core/repositories/users'
import { updateServerInfoFactory } from '@/modules/core/repositories/server'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { RATE_LIMITERS, createConsumer } from '@/modules/core/utils/ratelimiter'
import httpMocks from 'node-mocks-http'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { TIME } from '@speckle/shared'
import type { Application } from 'express'
import { passportAuthenticationCallbackFactory } from '@/modules/auth/services/passportService'
import { extendLoggerComponent, logger as baseLogger } from '@/observability/logging'

import { UserInputError } from '@/modules/core/errors/userinput'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import cryptoRandomString from 'crypto-random-string'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import {
  type BasicTestStream,
  createTestStream
} from '@/test/speckle-helpers/streamHelper'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'

const createInviteDirectly = createStreamInviteDirectly
const findInvite = findInviteFactory({ db })

const getUserByEmail = legacyGetUserByEmailFactory({ db })
const updateServerInfo = updateServerInfoFactory({ db })
const logger = extendLoggerComponent(baseLogger, 'auth-tests')

const expect = chai.expect

let app: Application
let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

describe('Auth @auth', () => {
  describe('Local authN & authZ (token endpoints)', () => {
    const registeredUserEmail = 'registered@speckle.systems'

    let me: BasicTestUser
    let myPrivateStream: BasicTestStream

    before(async () => {
      const ctx = await beforeEachContext()
      app = ctx.app
      ;({ sendRequest } = await initializeTestServer(ctx))

      // Register a user for testing login flows
      me = await createTestUser({
        name: 'dimitrie stefanescu',
        company: 'speckle',
        email: registeredUserEmail,
        password: 'roll saving throws',
        id: undefined
      })

      // Create a test stream for testing stream invites
      myPrivateStream = await createTestStream(
        {
          name: 'My Private Stream 1',
          isPublic: false,
          ownerId: me.id
        },
        me
      )
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
        const { token, id: inviteId } = await createInviteDirectly(
          streamInvite
            ? {
                email: targetEmail,
                streamId: myPrivateStream.id
              }
            : {
                email: targetEmail
              },
          inviterUser!.id
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

    let frontendCredentials: { token: string; refreshToken: string }

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

    // Rate limiting tests can only be run if the rate limiter is enabled when the application is loaded for the first time
    // `RATELIMITER_ENABLED='true'` has to be set in `.env.test` or when calling `RATELIMITER_ENABLED=true yarn test`
    ;(isRateLimiterEnabled() ? it : it.skip)(
      'Should rate-limit user creation',
      async () => {
        const newUser = async (id: string, ip: string, expectCode: number) => {
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
      }
    )
  })

  describe('passportAuthenticationCallbackFactory', () => {
    it('Should handle a successful passport authentication (a user exists)', async () => {
      const req = httpMocks.createRequest({})
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      const userId = cryptoRandomString({ length: 4 })

      SUT(null, { id: userId, email: createRandomEmail() }, undefined)

      expect(req).to.have.property('user')
      expect(req.user?.id).to.equal(userId)
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should have been called'
      ).to.equal(1)
    })
    it('Should handle case where there is an unexpected error but also a user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(
        new Error('I brrrrrooooken'),
        { id: cryptoRandomString({ length: 4 }), email: createRandomEmail() },
        undefined
      )

      // Should not have set the user if there was an error
      expect(req).to.not.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should have been called'
      ).to.equal(1)
      expect(
        nextCalledCounter,
        'next request handler should have been called'
      ).to.equal(1)
    })
    it('Should handle case where there is a user-derived failure but also a user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(
        null,
        { id: cryptoRandomString({ length: 4 }), email: createRandomEmail() },
        { failureType: 'UserInputError' }
      )
      expect(
        res._getRedirectUrl().includes('/error'),
        `Redirect url was '${res._getRedirectUrl()}'`
      ).to.be.true
      expect(req).not.to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should not have been called'
      ).to.equal(0)
    })
    it('Should handle the case where there is no user and no error', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(null, undefined, undefined)
      expect(
        res._getRedirectUrl().includes('/error'),
        `Redirect url was '${res._getRedirectUrl()}'`
      ).to.be.true
      expect(req).not.to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should not have been called'
      ).to.equal(0)
    })
    it('Should handle case where there is a user-derived failure and no user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(null, undefined, { failureType: 'UserInputError' })
      expect(
        res._getRedirectUrl().includes('/error'),
        `Redirect url was '${res._getRedirectUrl()}'`
      ).to.be.true
      expect(req).not.to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should not have been called'
      ).to.equal(0)
    })
    it('Should handle case where there is an unexpected error and no user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'wotStrategy',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(new Error('surprise!!!'), undefined, undefined)
      expect(req).not.to.have.property('user')
      expect(
        nextCalledCounter,
        'next request handler should have been called'
      ).to.equal(1)
      expect(
        errorCalledCounter,
        'next request handler should have been called with an error "next(err)"'
      ).to.equal(1)
    })
    it('should handle invalid grant user-derived failure and no user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'google',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(null, undefined, {
        failureType: 'InvalidGrantError',
        message: 'Some kind of invalid grant'
      })
      expect(
        res._getRedirectUrl().includes('/error'),
        `Redirect url was '${res._getRedirectUrl()}'`
      ).to.be.true
      expect(req).not.to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should not have been called'
      ).to.equal(0)
    })
    //TODO remove this if we upgrade to openid-client >=6.0.0
    it('should handle case for OIDC with a user-derived error and no user', async () => {
      const req = httpMocks.createRequest()
      req.log = logger
      const res = httpMocks.createResponse()
      let errorCalledCounter = 0
      let nextCalledCounter = 0
      const next = (err: unknown) => {
        if (err) {
          errorCalledCounter++
        }
        nextCalledCounter++
      }
      const SUT = passportAuthenticationCallbackFactory({
        strategy: 'oidc',
        req,
        res,
        next,
        resolveAuthRedirectPath: () => getFrontendOrigin()
      })

      SUT(new UserInputError('oidc version <6 is special'), undefined, undefined)
      expect(
        res._getRedirectUrl().includes('/error'),
        `Redirect url was '${res._getRedirectUrl()}'`
      ).to.be.true
      expect(req).not.to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should not have been called'
      ).to.equal(0)
    })
  })
})
