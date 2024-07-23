import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { AllScopes, Roles } from '@speckle/shared'
import { ApolloServer } from 'apollo-server-express'
import { expect } from 'chai'
import { createUser } from '@/modules/core/services/users'
import { createToken } from '@/modules/core/services/tokens'
import cryptoRandomString from 'crypto-random-string'
import {
  createWorkspaceQuery,
  getWorkspaceQuery,
  updateWorkspaceQuery
} from '@/modules/workspaces/tests/e2e/graph/queries'

describe('WorkspaceMutations type mutations', () => {
  let apollo: ApolloServer

  before(async () => {
    const userId = await createUser({
      name: 'John Speckle',
      email: 'test-user@example.org',
      password: 'high-quality-password'
    })

    const { token } = await createToken({
      userId,
      name: "John's test token",
      scopes: AllScopes
    })

    apollo = await buildApolloServer({
      context: () => {
        return addLoadersToCtx({
          auth: true,
          userId,
          role: Roles.Server.Admin,
          token,
          scopes: AllScopes
        })
      }
    })
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
