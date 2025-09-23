import {
  findEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { expect } from 'chai'
import { createTestUser } from '@/test/authHelper'
import { adminUpdateEmailVerificationFactory } from '@/modules/core/services/admin'
import {
  getUserFactory,
  updateUserEmailVerificationFactory
} from '@/modules/core/repositories/users'
import {
  deleteVerificationsFactory,
  getPendingVerificationByEmailFactory
} from '@/modules/emails/repositories'

describe('Admin @core-admin', () => {
  it('can mark users as verified', async () => {
    const email = createRandomEmail()

    const testUser = await createTestUser({
      name: 'John',
      email,
      password: createRandomPassword()
    })

    await adminUpdateEmailVerificationFactory({
      updateEmail: updateUserEmailFactory({ db }),
      deleteVerifications: deleteVerificationsFactory({ db }),
      updateUserVerification: updateUserEmailVerificationFactory({ db })
    })({
      email,
      verified: true
    })

    const userEmail = await findEmailFactory({ db })({ email })
    expect(userEmail).to.be.ok
    expect(userEmail!.verified).to.be.true

    const pendingVerifications = await getPendingVerificationByEmailFactory({
      db,
      verificationTimeoutMinutes: 100 // minutes
    })({ email })
    expect(pendingVerifications).to.be.undefined

    const user = await getUserFactory({ db })(testUser.id)
    expect(user).to.be.ok
    expect(user!.verified).to.be.true
  })
})
