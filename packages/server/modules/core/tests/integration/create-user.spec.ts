import { assert, expect } from 'chai'
import { createUser, getUser, getUserById } from '../../services/users'
import { beforeEach, describe, it } from 'mocha'
import { beforeEachContext } from '@/test/hooks'
import { UserRecord } from '../../helpers/types'
import knexInstance from '@/db/knex'
import { createRandomEmail, createRandomPassword } from '../../helpers/test-helpers'
import { USER_EMAILS_TABLE_NAME } from '@/modules/user-emails/constants'

const db = knexInstance
const userEmailsDB = db(USER_EMAILS_TABLE_NAME)

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
    try {
      await createUser({
        name: 'Dim Sum',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
    } catch {
      return
    }
    assert.fail('short pwd')
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
    await createUser(newUser)
      .then(() => {
        assert.fail('This should have failed with duplicate email error')
      })
      .catch((err) => {
        expect(err.message).to.equal('Email taken. Try logging in?')
      })
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

    const userEmail = await userEmailsDB.where({ email, userId, primary: true }).first()

    expect(userEmail).not.undefined
    expect(userEmail).not.null
  })
})
