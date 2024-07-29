import { beforeEachContext, initializeTestServer, truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { createPersonalAccessToken } from '@/modules/core/services/tokens'
import { Scopes } from '@speckle/shared'
import { createUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { UserEmail } from '@/modules/core/domain/userEmails/types'

describe('User emails graphql @core', () => {
  before(async () => {
    await truncateTables()
  })

  describe('userEmails query', () => {
    it('should return emails for user', async () => {
      const { app, server } = await beforeEachContext()
      const { sendRequest } = await initializeTestServer(server, app)
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      await createUserEmailFactory({ db })({
        userEmail: {
          email: createRandomEmail(),
          userId,
          primary: false
        }
      })
      const token = `Bearer ${await createPersonalAccessToken(
        userId,
        'test token user emails',
        [Scopes.Profile.Email]
      )}`
      const res = await sendRequest(token, {
        query: `query { userEmails { id } }`
      })

      expect(res.error).to.not.ok
      expect(res.body.data.userEmails).to.have.length(2)
    })
  })

})
