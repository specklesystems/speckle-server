import { createApp } from '@/modules/auth/services/apps'
import { createAppToken } from '@/modules/core/services/tokens'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  AppTokenCreateDocument,
  CreateTokenDocument,
  RevokeTokenDocument,
  TokenAppInfoDocument
} from '@/test/graphql/generated/graphql'
import {
  TestApolloServer,
  createTestContext,
  testApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes, Roles, Scopes } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
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

  it("don't show an associated app, if they actually don't have one", async () => {
    const { data, errors } = await apollo.execute(TokenAppInfoDocument, {})

    expect(data?.authenticatedAsApp?.id).to.not.be.ok
    expect(errors).to.not.be.ok
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

  it("can't create PAT with tokens:write scope", async () => {
    const scopes = [Scopes.Profile.Read, Scopes.Tokens.Write]
    const { data, errors } = await apollo.execute(
      CreateTokenDocument,
      {
        token: {
          name: 'sometoken',
          scopes
        }
      },
      {
        context: {
          scopes
        }
      }
    )

    expect(data?.apiTokenCreate).to.not.be.ok
    expect(errors).to.be.ok
    expect(
      errors!.find((e) =>
        e.message.includes(
          "You can't create a personal access token with the tokens:write scope"
        )
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

  describe('as PAT tokens', () => {
    it("can't create app tokens", async () => {
      const res = await apollo.execute(AppTokenCreateDocument, {
        token: { name: 'invalidone', scopes: [Scopes.Profile.Read] }
      })

      expect(res.data?.appTokenCreate).to.not.be.ok
      expect(res.errors).to.be.ok
      expect(
        res.errors!.find((e) =>
          e.message.includes(
            'An app token can only create a new token for the same app'
          )
        )
      ).to.be.ok
    })
  })

  describe('as app tokens', () => {
    let testApp1Id: string
    let testApp1Token: string
    let apollo: TestApolloServer

    before(async () => {
      const testApp1 = await createApp({
        name: cryptoRandomString({ length: 10 }),
        public: true,
        scopes: AllScopes,
        redirectUrl: 'http://127.0.0.1:1337'
      })
      testApp1Id = testApp1.id

      const appToken = await createAppToken({
        appId: testApp1Id,
        userId: userOne.id,
        name: 'testapp',
        scopes: AllScopes
      })
      testApp1Token = appToken

      apollo = await testApolloServer({
        context: createTestContext({
          auth: true,
          userId: userOne.id,
          role: Roles.Server.Admin,
          scopes: AllScopes,
          token: testApp1Token,
          appId: testApp1Id
        })
      })
    })

    it("can return the app they're associated with", async () => {
      const { data, errors } = await apollo.execute(TokenAppInfoDocument, {})

      expect(data?.authenticatedAsApp?.id).to.equal(testApp1Id)
      expect(errors).to.not.be.ok
    })

    it('can create new app tokens and revoke them', async () => {
      const { data, errors } = await apollo.execute(AppTokenCreateDocument, {
        token: { name: 'test', scopes: [Scopes.Profile.Read] }
      })

      expect(data?.appTokenCreate).to.be.ok
      expect(errors).to.not.be.ok

      const newToken = data?.appTokenCreate || ''
      const res = await apollo.execute(RevokeTokenDocument, { token: newToken })
      expect(res.data?.apiTokenRevoke).to.be.ok
      expect(res.errors).to.not.be.ok
    })

    it("can't create app tokens without the tokens:write scope", async () => {
      const { data, errors } = await apollo.execute(
        AppTokenCreateDocument,
        {
          token: { name: 'test', scopes: [Scopes.Profile.Read] }
        },
        {
          context: {
            scopes: [Scopes.Profile.Read]
          }
        }
      )

      expect(data?.appTokenCreate).to.not.be.ok
      expect(errors).to.be.ok
      expect(
        errors!.find((e) => e.message.includes('do not have the required privileges'))
      ).to.be.ok
    })

    it("can't create app tokens with scopes that the authenticated req itself doesn't have", async () => {
      const { data, errors } = await apollo.execute(
        AppTokenCreateDocument,
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

      expect(data?.appTokenCreate).to.not.be.ok
      expect(errors).to.be.ok
      expect(
        errors!.find((e) =>
          e.message.includes("You can't create a token with scopes that you don't have")
        )
      ).to.be.ok
    })
  })
})
