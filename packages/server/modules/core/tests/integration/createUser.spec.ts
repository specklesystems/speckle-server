import { expect } from 'chai'
import { createUser, getUser, getUserById } from '@/modules/core/services/users'
import { beforeEach, describe, it } from 'mocha'
import { beforeEachContext } from '@/test/hooks'
import { UserRecord } from '@/modules/core/helpers/types'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { expectToThrow } from '@/test/assertionHelper'
import { PasswordTooShortError } from '../../errors/userinput'
import { findPrimaryEmailForUserFactory } from '../../repositories/userEmails'

describe('Users @core-users', () => {
  beforeEach(async () => {
    await beforeEachContext()
  })

  it('Should create a user', async () => {
    const newUser = {
      name: 'John Doe',
      email: createRandomEmail(),
      password: createRandomPassword()
    }

    const actorId = await createUser(newUser)

    expect(actorId).to.be.a('string')
  })

  it('Should store user email lowercase', async () => {
    const user = {
      name: 'Marty McFly',
      email: createRandomEmail(),
      password: createRandomPassword()
    }

    const userId = await createUser(user)

    const storedUser = await getUser(userId)
    expect(storedUser.email).to.equal(user.email.toLowerCase())
  })
  it('Should not create a user with a too small password', async () => {
    const err = await expectToThrow(() =>
      createUser({
        name: 'Dim Sum',
        email: createRandomEmail(),
        password: createRandomPassword(5)
      })
    )
    expect(err.name).to.equal(PasswordTooShortError.name)
  })
  it('Should not create an user with the same email', async () => {
    const newUser = {
      name: 'John Doe',
      email: createRandomEmail(),
      password: createRandomPassword()
    }

    // create user
    await createUser(newUser)

    // try to create user with same email
    const err = await expectToThrow(() => createUser(newUser))
    expect(err.message).to.equal('Email taken. Try logging in?')
  })

  it('Should create a user with primary email', async () => {
    const email = createRandomEmail()

    const userId = await createUser({
      name: 'John Doe',
      email,
      password: createRandomPassword()
    })

    const user = (await getUserById({ userId })) as UserRecord
    expect(user.email).to.eq(email)

    const userEmail = await findPrimaryEmailForUserFactory({ db })({ userId })

    expect(userEmail).not.undefined
    expect(userEmail).not.null
  })
})
