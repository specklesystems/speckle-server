import { before } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { getUserByEmail, markUserAsVerified } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { UserEmails } from '@/modules/core/dbSchema'

const userEmailTable = db(UserEmails.name)

describe('Core @user-emails', () => {
  before(async () => {
    await beforeEachContext()
  })
  describe('getUserByEmail', () => {
    it('should return null if user email does not exist', async () => {
      expect(await getUserByEmail('test@example.org')).to.be.null
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
