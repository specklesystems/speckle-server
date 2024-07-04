import { before } from 'mocha'
import { createUser } from '../../services/users'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { getUserByEmail } from '../../repositories/users'
import { UserRecord } from '../../helpers/types'

describe.only('Core @user-emails', () => {
  before(async () => {
    await beforeEachContext()
  })
  describe('getUserByEmail', () => {
    it('should return null if user does not exist', async () => {
      expect(await getUserByEmail('test@example.org')).to.be.null
    })

    it('should return user if user-email does not exist', async () => {
      await createUser({
        name: 'John Doe',
        email: 'test@example.org',
        password: 'sn3aky-1337-b1m'
      })

      const user = (await getUserByEmail('test@example.org')) as UserRecord
      expect(user.name).to.eq('John Doe')
      expect(user.email).to.eq('test@example.org')
    })

    it('should return user merged with user-email', async () => {
      await createUser({
        name: 'John Doe',
        email: 'test@example.org',
        password: 'sn3aky-1337-b1m'
      })

      const user = (await getUserByEmail('test@example.org')) as UserRecord
      expect(user.name).to.eq('John Doe')
      expect(user.email).to.eq('test@example.org')
    })
  })
})
