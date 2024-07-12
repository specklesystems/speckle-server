import { before } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { getUserByEmail, markUserAsVerified } from '@/modules/core/repositories/users'
import { deleteUserEmailFactory } from '@/modules/core/repositories/userEmails'
import knexInstance from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/test-helpers'
import { USER_EMAILS_TABLE_NAME } from '@/modules/core/dbSchema'

const userEmailTable = knexInstance(USER_EMAILS_TABLE_NAME)

describe('Core @user-emails', () => {
  before(async () => {
    await beforeEachContext()
  })
  describe('getUserByEmail', () => {
    it('should return null if user does not exist', async () => {
      expect(await getUserByEmail('test@example.org')).to.be.null
    })

    it('should return user if user-email does not exist', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      await deleteUserEmailFactory({ db: knexInstance })({
        userId,
        email
      })

      const user = (await getUserByEmail(email))!
      expect(user.name).to.eq('John Doe')
      expect(user.email).to.eq(email)
    })
  })

  describe('markUserEmailAsVerified', () => {
    it('should mark user email as verified', async () => {
      const email = createRandomEmail()
      await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      await markUserAsVerified(email)

      const userEmail = await userEmailTable.where({ email }).first()
      expect(userEmail.verified).to.be.true
    })
  })
})
