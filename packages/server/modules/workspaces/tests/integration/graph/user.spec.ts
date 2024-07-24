import {
  createWorkspaceQuery,
  getActiveUserWorkspacesQuery
} from '@/modules/workspaces/tests/integration/graph/graph/queries'
import { createTestApolloServer } from '@/modules/workspaces/tests/integration/graph/utils/apollo'
import { createTestUserAndToken } from '@/modules/workspaces/tests/integration/graph/utils/user'
import { ApolloServer } from 'apollo-server-express'
import { expect } from 'chai'

describe('User type queries', () => {
  let apollo: ApolloServer

  before(async () => {
    const { userId, token } = await createTestUserAndToken()
    apollo = await createTestApolloServer(userId, token)
  })

  describe('workspaces', () => {
    before(async () => {
      await Promise.all(
        ['Workspace A', 'Workspace B'].map((name) =>
          createWorkspaceQuery(apollo, { name })
        )
      )
    })

    it('should return all workspaces for a user', async () => {
      const workspaces = await getActiveUserWorkspacesQuery(apollo)
      expect(workspaces.length).to.equal(2)
    })
  })
})
