import { describe } from 'mocha'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { expect } from 'chai'
import { UserEmails } from '@/modules/core/dbSchema'

const userEmailTable = db(UserEmails.name)

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

    const userEmail = await userEmailTable.where({ email }).first()
    expect(userEmail.verified).to.be.true
  })
})
