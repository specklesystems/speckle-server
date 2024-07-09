import { before } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { getUserByEmail } from '@/modules/core/repositories/users'
import { deleteUserEmailFactory } from '@/modules/user-emails/repositories/userEmails'
import knexInstance from '@/db/knex'
import { createRandomEmail, createRandomPassword } from '../../helpers/test-helpers'

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
})
