import { describe } from 'mocha'
import {
  findEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { expect } from 'chai'

describe('Verification @user-emails', () => {
  it('should mark user email as verified', async () => {
    const email = createRandomEmail()

    await createUser({
      name: 'John',
      email,
      password: createRandomPassword()
    })

    await markUserEmailAsVerifiedFactory({
      updateUserEmail: updateUserEmailFactory({ db })
    })({ email })

    const userEmail = await findEmailFactory({ db })({ email })
    expect(userEmail).to.be.ok
    expect(userEmail!.verified).to.be.true
  })
})
