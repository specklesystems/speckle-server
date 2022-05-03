/* istanbul ignore file */
const request = require('supertest')

const knex = require('@/db/knex')
const ResetTokens = () => knex('pwdreset_tokens')

const { beforeEachContext } = require('@/test/hooks')
const { createUser } = require('@/modules/core/services/users')

describe('Password reset requests @passwordresets', () => {
  let app
  const userA = {
    name: 'd1',
    email: 'd@speckle.systems',
    password: 'wowwow8charsplease'
  }

  before(async () => {
    ;({ app } = await beforeEachContext())
    userA.id = await createUser(userA)
  })

  it('Should carefully send a password request email', async () => {
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
      .send({ email: 'd@speckle.systems' })
      .expect(200)

    // already has expiration token, fall back
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: 'd@speckle.systems' })
      .expect(400)
  })

  it('Should reset passwords', async () => {
    const token = await ResetTokens().select().first()

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
      .send({ tokenId: token.id, password: '12345678' })
      .expect(200)

    // token used up, should fail
    await request(app)
      .post('/auth/pwdreset/finalize')
      .send({ tokenId: token.id, password: 'abc12345678' })
      .expect(400)
  })
})
