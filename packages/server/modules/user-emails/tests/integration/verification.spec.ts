import { describe } from 'mocha'
import { updateUserEmailFactory } from '../../repositories/userEmails'
import knexInstance from '@/db/knex'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/test-helpers'
import { USER_EMAILS_TABLE_NAME } from '../../constants'
import { markUserEmailAsVerifiedFactory } from '../../services/verification'
import { expect } from 'chai'

const userEmailTable = knexInstance(USER_EMAILS_TABLE_NAME)

describe('Verification @user-emails', () => {
  it('should mark user email as verified', async () => {
    const email = createRandomEmail()

    await createUser({
      name: 'John',
      email,
      password: createRandomPassword()
    })

    await markUserEmailAsVerifiedFactory({
      updateUserEmail: updateUserEmailFactory({ db: knexInstance })
    })(email)

    const userEmail = await userEmailTable.where({ email }).first()
    expect(userEmail.verified).to.be.true
  })
})
