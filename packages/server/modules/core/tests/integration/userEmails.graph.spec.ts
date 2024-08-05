import { beforeEachContext, truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { createUser } from '@/modules/core/services/users'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { createUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { UserEmails, Users } from '@/modules/core/dbSchema'
import { UserEmail } from '@/modules/core/domain/userEmails/types'
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateUserEmailDocument,
  DeleteUserEmailDocument,
  SetPrimaryUserEmailDocument
} from '@/test/graphql/generated/graphql'

describe('User emails graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })
  beforeEach(async () => {
    await truncateTables([Users.name, UserEmails.name])
  })

  describe('createUserEmail mutation', () => {
    it('should create new email for user', async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const email = createRandomEmail()

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(CreateUserEmailDocument, { input: { email } })

      expect(res).to.not.haveGraphQLErrors()
      const userEmail = await db<UserEmail>(UserEmails.name)
        .where({
          userId,
          email
        })
        .first()

      expect(userEmail).to.be.ok
      expect(res.data?.activeUserMutations.emailMutations.create).to.eq(userEmail!.id)
      expect(userEmail!.email).to.eq(email)
      expect(userEmail!.userId).to.eq(userId)
    })
  })

  describe('deleteUserEmail mutation', () => {
    it('should delete email for user', async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const email = createRandomEmail()

      const id = await createUserEmailFactory({ db })({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(DeleteUserEmailDocument, { input: { id } })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.activeUserMutations.emailMutations.delete).to.be.true
    })
  })

  describe('setPrimaryUserEmail mutation', () => {
    it('should set primary email for user', async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const email = createRandomEmail()

      const id = await createUserEmailFactory({ db })({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(SetPrimaryUserEmailDocument, { input: { id } })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.activeUserMutations.emailMutations.setPrimary).to.be.true
    })
  })
})
