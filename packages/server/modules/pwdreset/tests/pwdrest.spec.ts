import request from 'supertest'

import { knex } from '@/db/knex'

import { beforeEachContext } from '@/test/hooks'
import { localAuthRestApi } from '@/modules/auth/tests/helpers/registration'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type { BasicTestUser } from '@/test/authHelper'

const ResetTokens = () => knex('pwdreset_tokens')
const db = knex
const getServerInfo = getServerInfoFactory({ db })
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

describe('Password reset requests @passwordresets', () => {
  let app: Awaited<ReturnType<typeof beforeEachContext>>['app']

  before(async () => {
    ;({ app } = await beforeEachContext())
  })

  it('Should carefully send a password request email', async () => {
    const userA: BasicTestUser = {
      name: 'd1',
      email: 'd@speckle.systems',
      password: 'wowwow8charsplease',
      id: ''
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
    const userB: BasicTestUser = {
      name: 'd2',
      email: 'd2@speckle.systems',
      password: 'w0ww0w8charsplease',
      id: ''
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
          password: userB.password!,
          challenge: '123'
        })
    )
    expect(e).to.be.ok
    expect(e.message).to.contain('Invalid credentials')
  })
})
