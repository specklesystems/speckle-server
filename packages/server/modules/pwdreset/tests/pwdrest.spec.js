const request = require('supertest')

const knex = require('@/db/knex')
const ResetTokens = () => knex('pwdreset_tokens')

const { beforeEachContext } = require('@/test/hooks')
const { createUser } = require('@/modules/core/services/users')
const { localAuthRestApi } = require('@/modules/auth/tests/helpers/registration')
const { expectToThrow } = require('@/test/assertionHelper')
const { expect } = require('chai')

describe('Password reset requests @passwordresets', () => {
  let app

  before(async () => {
    ;({ app } = await beforeEachContext())
  })

  it('Should carefully send a password request email', async () => {
    const userA = {
      name: 'd1',
      email: 'd@speckle.systems',
      password: 'wowwow8charsplease'
    }
    userA.id = await createUser(userA)

    // invalid request
    await request(app).post('/auth/pwdreset/request').expect(400)

    // non-existent user
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: 'doesnot@exist.here' })
      .expect(400)

    // good request
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: userA.email })
      .expect(200)

    // already has expiration token, fall back
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: 'd@speckle.systems' })
      .expect(400)
  })

  it('Should reset passwords', async () => {
    const userB = {
      name: 'd2',
      email: 'd2@speckle.systems',
      password: 'w0ww0w8charsplease'
    }
    userB.id = await createUser(userB)

    const authRestApi = localAuthRestApi({ express: app })
    const newPassword = '12345678'

    // trigger request
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: userB.email })
      .expect(200)
    const token = await ResetTokens().select().where({ email: userB.email }).first()

    // invalid request
    await request(app).post('/auth/pwdreset/finalize').expect(400)

    // invalid request
    await request(app)
      .post('/auth/pwdreset/finalize')
      .send({ tokenId: 'fake' })
      .expect(400)

    // should be not ok, missing pwd
    await request(app)
      .post('/auth/pwdreset/finalize')
      .send({ tokenId: token.id })
      .expect(400)

    await request(app)
      .post('/auth/pwdreset/finalize')
      .send({ tokenId: token.id, password: newPassword })
      .expect(200)

    // token used up, should fail
    await request(app)
      .post('/auth/pwdreset/finalize')
      .send({ tokenId: token.id, password: 'abc12345678' })
      .expect(400)

    // should be able to log in with new pw
    await authRestApi.login({
      email: userB.email,
      password: newPassword,
      challenge: '123'
    })

    // should NOT be able to log in with old pw
    const e = await expectToThrow(
      async () =>
        await authRestApi.login({
          email: userB.email,
          password: userB.password,
          challenge: '123'
        })
    )
    expect(e).to.be.ok
    expect(e.message).to.contain('Invalid credentials')
  })
})
