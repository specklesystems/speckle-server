import { describe } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { expect } from 'chai'
import {
  getUserByEmail,
  getUsersFactory,
  listUsers
} from '@/modules/core/repositories/users'

const getUsers = getUsersFactory({ db })

describe('Find users @core', () => {
  describe('getUsers', () => {
    it('should return email field from user emails table', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (await getUsers([userId]))[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })

    it('should return email field from user emails table withRole enabled', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (await getUsers([userId], { withRole: true }))[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })
  })

  describe('listUsers', () => {
    it('should return email field from user emails table', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (
        await listUsers({ query: '', limit: 10, cursor: null, role: null })
      )[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })
  })

  describe('getUserByEmail', () => {
    it('should ignore email casing', async () => {
      const email = 'TeST@ExamPLE.oRg'
      await createUser({
        name: 'John Doe',
        password: createRandomPassword(),
        email
      })
      const user = await getUserByEmail(email)
      expect(user!.email).to.equal(email.toLowerCase())
    })
  })
})
