import { expect } from 'chai'
import { beforeEachContext } from '@/test/hooks'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { updateUserFactory } from '@/modules/core/repositories/users'
import { expectToThrow } from '@/test/assertionHelper'

import { buildBasicTestUser, createTestUser } from '@/test/authHelper'

const updateUser = updateUserFactory({ db })

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

  // this will never actually happen
  it('updates the user email', async () => {
    const { id: userId } = await createTestUser(
      buildBasicTestUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
    )

    const newEmail = createRandomEmail()
    await updateUser(userId, { email: newEmail }, { skipClean: true })

    const updated = await db('users').where({ id: userId }).first()
    expect(updated.email.toLowerCase()).eq(newEmail.toLowerCase())
  })
})
