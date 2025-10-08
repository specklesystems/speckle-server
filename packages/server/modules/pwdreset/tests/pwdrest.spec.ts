import request from 'supertest'

import { knex } from '@/db/knex'

import { beforeEachContext } from '@/test/hooks'
import { localAuthRestApi } from '@/modules/auth/tests/helpers/registration'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import { createTestUser } from '@/test/authHelper'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import cryptoRandomString from 'crypto-random-string'

const ResetTokens = () => knex('pwdreset_tokens')

describe('Password reset requests @passwordresets', () => {
  let app: Awaited<ReturnType<typeof beforeEachContext>>['app']

  before(async () => {
    ;({ app } = await beforeEachContext())
  })

  it('Should carefully send a password request email', async () => {
    const userA = await createTestUser({
      name: cryptoRandomString({ length: 10 }),
      email: createRandomEmail(),
      password: cryptoRandomString({ length: 8 }),
      id: ''
    })

    // invalid request
    await request(app).post('/auth/pwdreset/request').expect(400)

    // non-existent user
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: createRandomEmail() }) // does not exist
      .expect(200) // always 200 to prevent user enumeration

    // good request
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: userA.email })
      .expect(200)

    // already has expiration token, fall back
    await request(app)
      .post('/auth/pwdreset/request')
      .send({ email: userA.email })
      .expect(400)
  })

  it('Should reset passwords', async () => {
    const userB = await createTestUser({
      name: cryptoRandomString({ length: 10 }),
      email: createRandomEmail(),
      password: cryptoRandomString({ length: 8 }),
      id: ''
    })

    const authRestApi = localAuthRestApi({ express: app })
    const newPassword = cryptoRandomString({ length: 8 })

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
      .send({ tokenId: token.id, password: cryptoRandomString({ length: 8 }) })
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
          password: userB.password!,
          challenge: '123'
        })
    )
    expect(e).to.be.ok
    expect(e.message).to.contain('Invalid credentials')
  })
})
