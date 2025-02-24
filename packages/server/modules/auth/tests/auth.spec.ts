import crs from 'crypto-random-string'
import chai from 'chai'
import request from 'supertest'
import httpMocks from 'node-mocks-http'
import { TIME } from '@speckle/shared'
import { RATE_LIMITERS, createConsumer } from '@/modules/core/services/ratelimiter'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { createStreamInviteDirectly } from '@/test/speckle-helpers/inviteHelper'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import {
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { db } from '@/db/knex'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import {
  getStreamFactory,
  createStreamFactory
} from '@/modules/core/repositories/streams'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory,
  legacyGetUserByEmailFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  getServerInfoFactory,
  updateServerInfoFactory
} from '@/modules/core/repositories/server'
import { temporarilyEnableRateLimiter } from '@/modules/core/tests/ratelimiter.spec'
import { passportAuthenticationCallbackFactory } from '@/modules/auth/services/passportService'
import { testLogger } from '@/logging/logging'
import { Application } from 'express'

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
    emitEvent: getEventBus().emit
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
  emitEvent: getEventBus().emit
})
const getUserByEmail = legacyGetUserByEmailFactory({ db })
const updateServerInfo = updateServerInfoFactory({ db })

const expect = chai.expect

let app: Application
let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

describe('Auth @auth', () => {
  describe('Local authN & authZ (token endpoints)', () => {
    const registeredUserEmail = 'registered@speckle.systems'

    const me: {
      name: string
      company: string
      email: string
      password: string
      id?: string
    } = {
      name: 'dimitrie stefanescu',
      company: 'speckle',
      email: registeredUserEmail,
      password: 'roll saving throws',
      id: undefined
    }

    const myPrivateStream: {
      name: string
      isPublic: boolean
      id?: string
    } = {
      name: 'My Private Stream 1',
      isPublic: false,
      id: undefined
    }

    before(async () => {
      const ctx = await beforeEachContext()
      app = ctx.app
      ;({ sendRequest } = await initializeTestServer(ctx))

      // Register a user for testing login flows
      await createUser(me).then((id) => (me.id = id))

      // Create a test stream for testing stream invites
      await createStream({ ...myPrivateStream, ownerId: me.id! }).then(
        (id) => (myPrivateStream.id = id)
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
        const { token, inviteId } = await createInviteDirectly(
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

    it('Should rate-limit user creation', async () => {
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

      await temporarilyEnableRateLimiter(async () => {
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
      })

      RATE_LIMITERS.USER_CREATE = oldRateLimiter
    })
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
        next
      })

      SUT(null, { id: '123', email: 'weLoveAuth@example.org' }, undefined)

      expect(req).to.have.property('user')
      expect(req.user?.id).to.equal('123')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should not have been called'
      ).to.equal(0)
      expect(
        nextCalledCounter,
        'next request handler should have been called'
      ).to.equal(1)
    })
    it('Should handle case where there is an error but no user', async () => {
      const req = httpMocks.createRequest()
      req.log = testLogger
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
        next
      })

      SUT(new Error('I brrrrroke'), undefined, undefined)
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
    it('Should handle case where there is an error and a user', async () => {
      const req = httpMocks.createRequest()
      req.log = testLogger
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
        next
      })

      SUT(
        new Error('I brrrrrooooken'),
        { id: '1234', email: 'allFizzy@example.org' },
        undefined
      )
      expect(req).to.have.property('user')
      expect(
        errorCalledCounter,
        'error request handler "next(err)" should have been called'
      ).to.equal(1)
      expect(
        nextCalledCounter,
        'next request handler should have been called'
      ).to.equal(1)
    })
    it('Should handle the case where there is no user and no error', async () => {
      const req = httpMocks.createRequest()
      req.log = testLogger
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
        next
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
  })
})
