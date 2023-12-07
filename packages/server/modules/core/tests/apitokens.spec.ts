import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  CreateTokenDocument,
  RevokeTokenDocument
} from '@/test/graphql/generated/graphql'
import {
  TestApolloServer,
  createTestContext,
  testApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes, Roles, Scopes } from '@speckle/shared'
import { expect } from 'chai'
import { difference } from 'lodash'

/**
 * Older API token test cases can be found in `graph.spec.js`
 */
describe('API Tokens', () => {
  const userOne: BasicTestUser = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    await createTestUsers([userOne])

    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: userOne.id,
        role: Roles.Server.Admin,
        token: 'asd',
        scopes: AllScopes
      })
    })
  })

  it("can't create PATs with scopes that the authenticated req itself doesn't have", async () => {
    const { data, errors } = await apollo.execute(
      CreateTokenDocument,
      {
        token: {
          name: 'invalidone',
          scopes: [Scopes.Profile.Read, Scopes.Streams.Read]
        }
      },
      {
        context: {
          scopes: [Scopes.Profile.Read, Scopes.Tokens.Write]
        }
      }
    )

    expect(data?.apiTokenCreate).to.not.be.ok
    expect(errors).to.be.ok
    expect(
      errors!.find((e) =>
        e.message.includes("You can't create a token with scopes that you don't have")
      )
    ).to.be.ok
  })

  describe('without the tokens:write scope', () => {
    const limitedTokenScopes = difference(AllScopes, [Scopes.Tokens.Write])
    let limitedToken: string

    before(async () => {
      const res = await apollo.execute(CreateTokenDocument, {
        token: { name: 'limited', scopes: limitedTokenScopes }
      })

      limitedToken = res.data?.apiTokenCreate || ''
      if (!limitedToken.length) {
        throw new Error("Couldn't prepare token for test")
      }
    })

    it("can't create PAT tokens", async () => {
      const { data, errors } = await apollo.execute(
        CreateTokenDocument,
        {
          token: { name: 'invalidone', scopes: [Scopes.Profile.Read] }
        },
        {
          context: {
            scopes: limitedTokenScopes,
            token: limitedToken
          }
        }
      )

      expect(data?.apiTokenCreate).to.not.be.ok
      expect(errors).to.be.ok
      expect(
        errors!.find((e) => e.message.includes('do not have the required privileges'))
      ).to.be.ok
    })

    it("can't delete PAT tokens", async () => {
      const { data, errors } = await apollo.execute(
        RevokeTokenDocument,
        { token: limitedToken },
        {
          context: {
            scopes: limitedTokenScopes,
            token: limitedToken
          }
        }
      )

      expect(data?.apiTokenRevoke).to.not.be.ok
      expect(errors).to.be.ok
      expect(
        errors!.find((e) => e.message.includes('do not have the required privileges'))
      ).to.be.ok
    })
  })
})
