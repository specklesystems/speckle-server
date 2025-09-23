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
import { updateUserEmailVerificationFactory } from '@/modules/core/repositories/users'
import { deleteVerificationsFactory } from '@/modules/emails/repositories'

describe('Admin @core-admin', () => {
  it('can mark users as verified', async () => {
    const email = createRandomEmail()

    await createTestUser({
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

    //TODO check verifications deleted
    //TODO check user updated
  })
})
