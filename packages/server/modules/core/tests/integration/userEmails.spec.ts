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
import {
  createUserEmailFactory,
  deleteUserEmailFactory,
  findEmailFactory,
  setPrimaryUserEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { expectToThrow } from '@/test/assertionHelper'

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

  describe('deleteUserEmail', () => {
    it('should throw and error when trying to delete last email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      const userEmail = await findEmailFactory({ db })({ userId, email })

      const err = await expectToThrow(() =>
        deleteUserEmailFactory({ db })({ id: userEmail.id, userId })
      )
      expect(err.message).to.eq('Cannot delete last user email')
    })

    it('should throw and error when trying to delete primary email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      await createUserEmailFactory({ db })({
        userEmail: {
          email: createRandomEmail(),
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({ userId, email, primary: true })

      const err = await expectToThrow(() =>
        deleteUserEmailFactory({ db })({ id: userEmail.id, userId })
      )
      expect(err.message).to.eq('Cannot delete primary email')
    })

    it('should delete email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmailFactory({ db })({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })

      const deleted = await deleteUserEmailFactory({ db })({ id: userEmail.id, userId })

      expect(deleted).to.be.true

      const deletedUserEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })

      expect(deletedUserEmail).to.not.ok
    })
  })

  describe('setPrimaryUserEmail', () => {
    it('should set primary email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmailFactory({ db })({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })

      const updated = await setPrimaryUserEmailFactory({ db })({
        id: userEmail.id,
        userId
      })

      expect(updated).to.be.true

      const previousPrimary = await findEmailFactory({ db })({
        userId,
        primary: false
      })
      const newPrimary = await findEmailFactory({ db })({
        userId,
        primary: true
      })

      expect(previousPrimary.primary).to.be.false
      expect(newPrimary.primary).to.be.true
    })
  })

  describe('createUserEmail', () => {
    it('should throw an error when trying to create a a primary email for a user and there is already one for that user', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      const err = await expectToThrow(() =>
        createUserEmailFactory({ db })({
          userEmail: {
            email,
            userId,
            primary: true
          }
        })
      )

      expect(err.message).to.eq('A primary email already exists for this user')
    })
  })

  describe('updateUserEmail', () => {
    it('should throw an error when trying to mark an email as primary and there is already one for the user', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmailFactory({ db })({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })

      const err = await expectToThrow(() =>
        updateUserEmailFactory({ db })({
          query: {
            id: userEmail.id,
            userId
          },
          update: { primary: true }
        })
      )

      expect(err.message).to.eq('A primary email already exists for this user')
    })
  })
})
