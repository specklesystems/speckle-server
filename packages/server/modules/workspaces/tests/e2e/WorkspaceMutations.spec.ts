import { buildApolloServer } from '@/app'
import { addLoadersToCtx } from '@/modules/shared/middleware'
import { AllScopes, Roles } from '@speckle/shared'
import { ApolloServer, gql } from 'apollo-server-express'
import cryptoRandomString from 'crypto-random-string'
import knex from '@/db/knex'
import { expect } from 'chai'

describe('WorkspaceMutations type mutations', () => {
  let apollo: ApolloServer

  before(async () => {
    const userId = cryptoRandomString({ length: 10 })

    apollo = await buildApolloServer({
      context: () => {
        addLoadersToCtx({
          auth: true,
          userId,
          role: Roles.Server.User,
          token: 'asd',
          scopes: AllScopes
        })
      }
    })
  })

  describe('create', () => {
    it('should create a workspace', async () => {
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
            name: 'My workspace'
          }
        }
      })

      const { id } = data?.workspaceMutations.create

      const workspace = await knex('workspaces').where({ id }).first()

      expect(workspace).to.exist
    })
  })
})
