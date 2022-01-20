/* istanbul ignore file */
const chai = require('chai')
const chaiHttp = require('chai-http')

const appRoot = require('app-root-path')
const { init, startHttp } = require(`${appRoot}/app`)
const request = require('supertest')

const expect = chai.expect
chai.use(chaiHttp)

const knex = require(`${appRoot}/db/knex`)

const { createUser } = require(`${appRoot}/modules/core/services/users`)
const {
  createPersonalAccessToken,
} = require(`${appRoot}/modules/core/services/tokens`)

const {
  sendEmailVerification,
} = require(`${appRoot}/modules/emails/services/verification`)

const Verifications = () => knex('email_verifications')

describe('Email verifications @emails', () => {
  let expressApp



  const userA = {
    'name': 'd1',
    'email': 'd.1@speckle.systems',
    'password': 'wowwowwowwowwow',
  }
  const userB = {
    'name': 'd2',
    'email': 'd.2@speckle.systems',
    'password': 'wowwowwowwowwow',
  }

  before(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()

    let { app } = await init()
    expressApp = app

    userA.id = await createUser(userA)
    userA.token = `Bearer ${(await createPersonalAccessToken(userA.id, 'test token user A', ['server:setup', 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email']))}`
    userB.id = await createUser(userB)
    userB.token = `Bearer ${(await createPersonalAccessToken(userB.id, 'test token user B', ['streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email']))}`
  })

  after(async () => {
    await knex.migrate.rollback()
  })

  describe('Create email verification', () => {
    it('Should create a new verification', async () => {
      const sentResult = await sendEmailVerification(
        { 'recipient': userA.email },
      )
      const verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(1)

      const ver = verifications[0]
      const expectedVerificationUrl = `${process.env.CANONICAL_URL}/auth/verifyemail?t=${ver.id}`

      expect(sentResult.message).to.contain(expectedVerificationUrl)

      await request(expressApp)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .set('Authorization', userA.token)
        .expect(200)
    })
    it('Should fail to send verification unauthenticated / not the same user',
      async () => {
        await request(expressApp)
          .post('/auth/emailverification/request')
          .send({ email: userA.email })
          .expect(403)

        await request(expressApp)
          .post('/auth/emailverification/request')
          .send({ email: userA.email })
          .set('Authorization', userB.token)
          .expect(403)
      })
  })
  describe('Use email verification', () => {
    it('Should not verify without a token', async () => {
      await request(expressApp)
        .get('/auth/verifyemail')
        .expect(400)
      
      await request(expressApp)
        .get('/auth/verifyemail?t=')
        .expect(400)
    })
    it('Should not verify with an invalid token', async () => {
      await request(expressApp)
        .get('/auth/verifyemail?t=bogus')
        .expect(404)
    })
    it('Should not verify with a expired token', async () => {
      // current expiry is 24h
      const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
      const expiredVerification = {
        id: 'imexpiredlikeamontholdcartonofmilk',
        email: 'who@cares.about',
        createdAt: yesterday
      }
      await Verifications().insert(expiredVerification)

      await request(expressApp)
        .get(`/auth/verifyemail?t=${expiredVerification.id}`)
        .expect(400)

      await Verifications().where({ id: expiredVerification.id }).del()
    })

    it('Should verify with a valid token and redirect to /', async () => {
      let verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(2)

      await request(expressApp)
        .get(`/auth/verifyemail?t=${verifications[0].id}`)
        .expect(302)

      verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(1)
    })
  })
})
