import { ApolloServer } from 'apollo-server-express'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createWorkspaceQuery,
  getWorkspaceQuery,
  updateWorkspaceQuery
} from '@/modules/workspaces/tests/integration/graph/graph/queries'
import { createTestApolloServer } from '@/modules/workspaces/tests/integration/graph/utils/apollo'
import { createTestUserAndToken } from '@/modules/workspaces/tests/integration/graph/utils/user'

describe('WorkspaceMutations type mutations', () => {
  let apollo: ApolloServer

  before(async () => {
    const { userId, token } = await createTestUserAndToken()
    apollo = await createTestApolloServer(userId, token)
  })

  describe('create', () => {
    it('should create a workspace', async () => {
      const workspaceName = cryptoRandomString({ length: 6 })

      const { id } = await createWorkspaceQuery(apollo, { name: workspaceName })

      const workspace = await getWorkspaceQuery(apollo, { workspaceId: id })

      expect(workspace).to.exist
      expect(workspace?.name).to.equal(workspaceName)
    })
  })

  describe('update', () => {
    it('should update a workspace', async () => {
      const { id: workspaceId } = await createWorkspaceQuery(apollo, {
        name: cryptoRandomString({ length: 6 })
      })

      const workspaceName = cryptoRandomString({ length: 6 })

      await updateWorkspaceQuery(apollo, {
        workspaceId,
        workspaceInput: {
          name: workspaceName
        }
      })

      const workspace = await getWorkspaceQuery(apollo, { workspaceId })

      expect(workspace?.name).to.equal(workspaceName)
    })
  })
})
