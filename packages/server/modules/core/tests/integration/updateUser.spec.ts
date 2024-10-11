import { expect } from 'chai'
import { createUser, getUser } from '@/modules/core/services/users'
import { beforeEach, describe, it } from 'mocha'
import { beforeEachContext } from '@/test/hooks'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { UserEmails } from '@/modules/core/dbSchema'
import { updateUser } from '@/modules/core/repositories/users'
import { expectToThrow } from '@/test/assertionHelper'

const userEmailsDB = db(UserEmails.name)

describe('Users @core-users', () => {
  beforeEach(async () => {
    await beforeEachContext()
  })

  it('should throw an error if avatar is too big', async () => {
    const longAvatar = ''.padEnd(524288, '1') + '0'
    const err = await expectToThrow(() => updateUser('123456', { avatar: longAvatar }))

    expect(err.message).eq('User avatar is too big, please try a smaller one')
  })

  it('should throw an error if update payload is empty', async () => {
    const err = await expectToThrow(() => updateUser('123456', {}))

    expect(err.message).eq('User update payload empty')
  })

  it('Should update user email if skipClean is true', async () => {
    const email = createRandomEmail()
    const newUser = {
      name: 'John Doe',
      email,
      password: createRandomPassword()
    }

    const userId = await createUser(newUser)

    const newEmail = createRandomEmail()
    await updateUser(userId, { email: newEmail }, { skipClean: true })

    const updated = await getUser(userId)
    const updatedUserEmail = await userEmailsDB.where({ userId, primary: true }).first()

    expect(updated.email.toLowerCase()).eq(newEmail.toLowerCase())
    expect(updatedUserEmail.email.toLowerCase()).eq(newEmail.toLowerCase())
  })
})
