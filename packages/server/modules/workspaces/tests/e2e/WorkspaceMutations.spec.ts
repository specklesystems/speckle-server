import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { AllScopes, Roles } from '@speckle/shared'
import { ApolloServer, gql } from 'apollo-server-express'
import knex from '@/db/knex'
import { expect } from 'chai'
import { createUser } from '@/modules/core/services/users'
import { createToken } from '@/modules/core/services/tokens'
import cryptoRandomString from 'crypto-random-string'

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

      const { data } = await apollo?.executeOperation({
        query: gql`
          mutation ($input: WorkspaceCreateInput!) {
            workspaceMutations {
              create(input: $input) {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            name: workspaceName
          }
        }
      })

      const { id } = data?.workspaceMutations.create

      const workspace = await knex('workspaces').where({ id }).first()

      expect(workspace).to.exist
      expect(workspace.name).to.equal(workspaceName)
    })
  })
})
