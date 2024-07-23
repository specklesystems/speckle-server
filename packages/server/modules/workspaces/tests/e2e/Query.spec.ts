import { ApolloServer } from 'apollo-server-express'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createWorkspaceQuery,
  getWorkspaceQuery
} from '@/modules/workspaces/tests/e2e/graph/queries'
import { createTestApolloServer } from '@/modules/workspaces/tests/e2e/utils/apollo'
import { expectToThrow } from '@/test/assertionHelper'
import { createTestUserAndToken } from '@/modules/workspaces/tests/e2e/utils/user'

describe('Root Query type', () => {
  let apollo: ApolloServer

  before(async () => {
    const { userId, token } = await createTestUserAndToken()
    apollo = await createTestApolloServer(userId, token)
  })

  describe('workspace', () => {
    let workspaceId = ''

    before(async () => {
      const { id } = await createWorkspaceQuery(apollo, { name: 'test workspace' })
      workspaceId = id
    })

    it('should return a workspace that exists', async () => {
      const workspace = await getWorkspaceQuery(apollo, { workspaceId })

      expect(workspace).to.exist
    })

    it('throw a not found error if the workspace does not exist', async () => {
      await expectToThrow(() =>
        getWorkspaceQuery(apollo, { workspaceId: cryptoRandomString({ length: 6 }) })
      )
    })
  })
})
