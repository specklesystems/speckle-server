/* istanbul ignore file */
const expect = require('chai').expect

const { beforeEachContext } = require('@/test/hooks')
const request = require('supertest')

const knex = require('@/db/knex')

const { createUser } = require('@/modules/core/services/users')
const { createPersonalAccessToken } = require('@/modules/core/services/tokens')

const { sendEmailVerification } = require('@/modules/emails/services/verification')

const Verifications = () => knex('email_verifications')

describe('Email verifications @emails', () => {
  let app

  const userA = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    password: 'wowwowwowwowwow'
  }
  const userB = {
    name: 'd2',
    email: 'd.2@speckle.systems',
    password: 'wowwowwowwowwow'
  }

  before(async () => {
    ;({ app } = await beforeEachContext())

    userA.id = await createUser(userA)
    userA.token = `Bearer ${await createPersonalAccessToken(
      userA.id,
      'test token user A',
      [
        'server:setup',
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`
    userB.id = await createUser(userB)
    userB.token = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
      [
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`
  })

  describe('Create email verification', () => {
    it('Should create a new verification', async () => {
      const sentResult = await sendEmailVerification({ recipient: userA.email })
      const verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(1)

      const ver = verifications[0]
      const expectedVerificationUrl = `${process.env.CANONICAL_URL}/auth/verifyemail?t=${ver.id}`

      expect(sentResult.message).to.contain(expectedVerificationUrl)

      await Verifications().where({ id: ver.id }).del()

      await request(app)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .set('Authorization', userA.token)
        .expect(200)
    })
    it('Should fail to send verification unauthenticated / not the same user', async () => {
      await request(app)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .expect(403)

      await request(app)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .set('Authorization', userB.token)
        .expect(403)
    })
    it('Should not create a new verification while the previous is valid', async () => {
      await request(app)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .set('Authorization', userA.token)
        .expect(400)
    })
    it('Should create a new verification if the previous is invalid', async () => {
      await Verifications()
        .where({ email: userA.email })
        .update({ createdAt: new Date(0) })

      await request(app)
        .post('/auth/emailverification/request')
        .send({ email: userA.email })
        .set('Authorization', userA.token)
        .expect(200)
    })
  })
  describe('Use email verification', () => {
    it('Should not verify without a token', async () => {
      await request(app).get('/auth/verifyemail').expect(400)

      await request(app).get('/auth/verifyemail?t=').expect(400)
    })
    it('Should not verify with an invalid token', async () => {
      await request(app).get('/auth/verifyemail?t=bogus').expect(404)
    })
    it('Should not verify with a expired token', async () => {
      // current expiry is 24h
      const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
      const expiredVerification = {
        id: 'imexpiredlikeamontholdcartonofmilk',
        email: 'who@cares.about',
        createdAt: yesterday
      }
      await Verifications().insert(expiredVerification)

      await request(app)
        .get(`/auth/verifyemail?t=${expiredVerification.id}`)
        .expect(400)

      await Verifications().where({ id: expiredVerification.id }).del()
    })

    it('Should verify with a valid token and redirect to /', async () => {
      let verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(2)

      await request(app).get(`/auth/verifyemail?t=${verifications[1].id}`).expect(302)

      verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(1)
    })
  })
})
