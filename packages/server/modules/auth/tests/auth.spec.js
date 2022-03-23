/* istanbul ignore file */
const crs = require('crypto-random-string')
const chai = require('chai')
const request = require('supertest')
const appRoot = require('app-root-path')
const { createStream, getStream } = require(`${appRoot}/modules/core/services/streams`)

const { updateServerInfo } = require(`${appRoot}/modules/core/services/generic`)
const { getUserByEmail } = require(`${appRoot}/modules/core/services/users`)
const { LIMITS } = require(`${appRoot}/modules/core/services/ratelimits`)
const { createAndSendInvite } = require(`${appRoot}/modules/serverinvites/services`)
const { beforeEachContext, initializeTestServer } = require(`${appRoot}/test/hooks`)
const expect = chai.expect

let app
let sendRequest
let server

describe('Auth @auth', () => {
  describe('Local authN & authZ (token endpoints)', () => {
    before(async () => {
      ;({ app } = await beforeEachContext())
      ;({ server, sendRequest } = await initializeTestServer(app))
    })

    after(async () => {
      await server.close()
    })

    it('Should register a new user (speckle frontend)', async () => {
      await request(app)
        .post('/auth/local/register?challenge=test&suuid=test')
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

    it('Should not register a new user without an invite id in an invite id only server', async () => {
      await updateServerInfo({ inviteOnly: true })

      // No invite
      await request(app)
        .post('/auth/local/register?challenge=test&suuid=test')
        .send({
          email: 'spam@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(400)

      let user = await getUserByEmail({ email: 'spam@speckle.systems' })
      let inviteId = await createAndSendInvite({
        email: 'bunny@speckle.systems',
        inviterId: user.id
      })

      // Mismatched invite
      await request(app)
        .post('/auth/local/register?challenge=test&suuid=test&inviteId=' + inviteId)
        .send({
          email: 'spam-super@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(400)

      // Invalid inviteId
      await request(app)
        .post('/auth/local/register?challenge=test&suuid=test&inviteId=' + 'inviteId')
        .send({
          email: 'spam-super@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(400)

      // finally correct
      await request(app)
        .post('/auth/local/register?challenge=test&suuid=test&inviteId=' + inviteId)
        .send({
          email: 'bunny@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(302)

      await updateServerInfo({ inviteOnly: false })
    })

    it('Should add resource access to newly registered user if the invite contains it', async () => {
      let user = await getUserByEmail({ email: 'spam@speckle.systems' })
      const streamId = await createStream({ ownerId: user.id })
      const inviteId = await createAndSendInvite({
        email: 'new@stream.collaborator',
        inviterId: user.id,
        resourceTarget: 'streams',
        resourceId: streamId,
        role: 'stream:reviewer'
      })

      const res = await request(app)
        .post('/auth/local/register?challenge=test&suuid=test&inviteId=' + inviteId)
        .send({
          email: 'new@stream.collaborator',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(302)

      const collaborator = await getUserByEmail({ email: 'new@stream.collaborator' })
      const stream = await getStream({ streamId, userId: collaborator.id })
      expect(stream.role).to.equal('stream:reviewer')
    })

    it('Should log in (speckle frontend)', async () => {
      let res = await request(app)
        .post('/auth/local/login?challenge=test')
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
    })

    it('Should fail nicely to log in (speckle frontend)', async () => {
      let res = await request(app)
        .post('/auth/local/login?challenge=test')
        .send({ email: 'spam@speckle.systems', password: 'roll saving throw' })
        .expect(401)
    })

    it('Should redirect login with access code (speckle frontend)', async () => {
      let appId = 'sdm'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]
      expect(accessCode).to.be.a('string')
    })

    it('Should redirect registration with access code (speckle frontend)', async () => {
      let appId = 'sdm'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/register?challenge=${challenge}`)
        .send({
          email: 'spam_2@speckle.systems',
          name: 'dimitrie stefanescu',
          company: 'speckle',
          password: 'roll saving throws'
        })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]
      expect(accessCode).to.be.a('string')
    })

    it('Should exchange a token for an access code (speckle frontend)', async () => {
      let appId = 'spklwebapp'
      let appSecret = 'spklwebapp'
      let challenge = 'spklwebapp'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]

      let tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist
    })

    it('Should not exchange a token for an access code with a different app', async () => {
      let appId = 'sdm'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      let accessCode = res.headers.location.split('access_code=')[1]

      // Swap the app
      tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a wrong challenge', async () => {
      let appId = 'sdm'
      let challenge = 'random'
      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      let accessCode = res.headers.location.split('access_code=')[1]

      // Spoof the challenge
      let tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: 'sdm', accessCode, challenge: 'WRONG' })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a wrong secret', async () => {
      let appId = 'sdm'
      let challenge = 'random'
      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      let accessCode = res.headers.location.split('access_code=')[1]

      // Spoof the secret
      tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: 'spoof', accessCode, challenge })
        .expect(401)
    })

    it('Should not exchange a token for an access code with a garbage input', async () => {
      let appId = 'sdm'
      let challenge = 'random'
      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)
      let accessCode = res.headers.location.split('access_code=')[1]

      // Send pure garbage
      tokenResponse = await request(app)
        .post('/auth/token')
        .send({ accessCode, challenge })
        .expect(401)
    })

    it('Should refresh a token (speckle frontend)', async () => {
      let appId = 'spklwebapp'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]

      let tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      let refreshTokenResponse = await request(app)
        .post('/auth/token')
        .send({ refreshToken: tokenResponse.body.refreshToken, appId, appSecret: appId })
        .expect(200)

      expect(refreshTokenResponse.body.token).to.exist
      expect(refreshTokenResponse.body.refreshToken).to.exist
    })

    it('Should not refresh a token with bad juju inputs (speckle frontend)', async () => {
      let appId = 'spklwebapp'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]

      let tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      // spoof secret
      let refreshTokenResponse = await request(app)
        .post('/auth/token')
        .send({ refreshToken: tokenResponse.body.refreshToken, appId, appSecret: 'WRONG' })
        .expect(401)

      // swap app (use on rt for another app)
      refreshTokenResponse = await request(app)
        .post('/auth/token')
        .send({ refreshToken: tokenResponse.body.refreshToken, appId: 'sdm', appSecret: 'sdm' })
        .expect(401)
    })

    let frontendCredentials

    it('Should get an access code (redirected response)', async () => {
      let appId = 'spklwebapp'
      let challenge = 'random'

      let res = await request(app)
        .post(`/auth/local/login?challenge=${challenge}`)
        .send({ email: 'spam@speckle.systems', password: 'roll saving throws' })
        .expect(302)

      let accessCode = res.headers.location.split('access_code=')[1]

      let tokenResponse = await request(app)
        .post('/auth/token')
        .send({ appId, appSecret: appId, accessCode, challenge })
        .expect(200)

      expect(tokenResponse.body.token).to.exist
      expect(tokenResponse.body.refreshToken).to.exist

      frontendCredentials = tokenResponse.body

      let response = await request(app)
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
      let response = await request(app)
        .get(
          `/auth/accesscode?appId=lol&challenge=${crs({ length: 20 })}&token=${
            frontendCredentials.token
          }`
        )
        .expect(400)

      // Spoofed token
      response = await request(app)
        .get(`/auth/accesscode?appId=sdm&challenge=${crs({ length: 20 })}&token=I_AM_HACZ0R`)
        .expect(400)

      // No challenge
      response = await request(app)
        .get(`/auth/accesscode?appId=explorer&token=${frontendCredentials.token}`)
        .expect(400)
    })

    it('Should not freak out on malformed logout request', async () => {
      let response = await request(app)
        .post('/auth/logout')
        .send({ adsfadsf: frontendCredentials.token })
        .expect(400)
    })

    it('Should invalidate tokens on logout', async () => {
      let response = await request(app)
        .post('/auth/logout')
        .send({ ...frontendCredentials })
        .expect(200)
    })

    it('ServerInfo Query should return the auth strategies available', async () => {
      const query = 'query sinfo { serverInfo { authStrategies { id name icon url color } } }'
      const res = await sendRequest(null, { query })
      expect(res.body.errors).to.not.exist
      expect(res.body.data.serverInfo.authStrategies).to.be.an('array')
    })

    it('Should rate-limit user creation', async () => {
      let newUser = async (id, ip, expectCode) => {
        console.log(id, ip, expectCode)
        await request(app)
          .post(`/auth/local/register?challenge=test&suuid=test`)
          .set('CF-Connecting-IP', ip)
          .send({
            email: `rltest_${id}@speckle.systems`,
            name: 'ratelimit test',
            company: 'test',
            password: 'roll saving throws'
          })
          .expect(expectCode)
      }

      let oldLimit = LIMITS.USER_CREATE
      LIMITS.USER_CREATE = 5
      // 5 users should be fine
      for (let i = 0; i < 5; i++) {
        await newUser(`test${i}`, '1.2.3.4', 302)
      }
      // should fail the 6th user
      await newUser(`test${5}`, '1.2.3.4', 400)

      // should be able to create from different ip
      for (let i = 0; i < 5; i++) {
        await newUser(`othertest${i}`, '1.2.3.5', 302)
      }

      // should not be limited from unknown ip addresses
      for (let i = 0; i < 10; i++) {
        await newUser(`generic${i}`, '', 302)
      }

      LIMITS.USER_CREATE = oldLimit
    })
  })
})
