import { Users } from '@/modules/core/dbSchema'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { getActiveUser, getOtherUser } from '@/test/graphql/users'
import { truncateTables } from '@/test/hooks'
import {
  buildAuthenticatedApolloServer,
  buildUnauthenticatedApolloServer
} from '@/test/serverHelper'
import { ApolloServer } from 'apollo-server-express'
import { expect } from 'chai'

describe('Users (GraphQL)', () => {
  const me: BasicTestUser = {
    id: '',
    email: '',
    name: 'its a meeeee',
    bio: 'ayyy',
    company: 'ayyy inc'
  }

  const otherGuy: BasicTestUser = {
    id: '',
    email: '',
    name: 'its an other guyyyyy',
    bio: 'fffoooo',
    company: 'fooooo inc'
  }

  before(async () => {
    await truncateTables([Users.name])
    await createTestUsers([me, otherGuy])
  })

  describe('when unauthenticated', () => {
    let apollo: ApolloServer

    before(async () => {
      apollo = await buildUnauthenticatedApolloServer()
    })

    it('activeUser returns null', async () => {
      const results = await getActiveUser(apollo)

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.activeUser).to.be.null
    })

    it('otherUser throws an authorization error', async () => {
      const results = await getOtherUser(apollo, { id: otherGuy.id })

      expect(results.data?.otherUser).to.be.null
      expect(results).to.haveGraphQLErrors('you do not have the required privileges')
    })
  })

  describe('when authenticated', () => {
    let apollo: ApolloServer

    before(async () => {
      apollo = await buildAuthenticatedApolloServer(me.id)
    })

    it('activeUser returns authenticated user info', async () => {
      const results = await getActiveUser(apollo)

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.activeUser?.id).to.eq(me.id)
      expect(results.data?.activeUser?.name).to.be.ok
      expect(results.data?.activeUser?.bio).to.be.ok
      expect(results.data?.activeUser?.company).to.be.ok
    })

    it('otherUser returns limited user info', async () => {
      const results = await getOtherUser(apollo, { id: otherGuy.id })

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.otherUser?.id).to.eq(otherGuy.id)
      expect(results.data?.otherUser?.name).to.be.ok
      expect(results.data?.otherUser?.bio).to.be.ok
      expect(results.data?.otherUser?.company).to.be.ok
    })
  })
})
