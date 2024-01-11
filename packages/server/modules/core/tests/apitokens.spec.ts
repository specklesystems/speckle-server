import { createApp } from '@/modules/auth/services/apps'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { createAppToken } from '@/modules/core/services/tokens'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  AppTokenCreateDocument,
  CreateTokenDocument,
  GetUserStreamsDocument,
  ReadStreamDocument,
  ReadStreamsDocument,
  RevokeTokenDocument,
  TokenAppInfoDocument
} from '@/test/graphql/generated/graphql'
import {
  TestApolloServer,
  createTestContext,
  testApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { AllScopes, Roles, Scopes } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { difference } from 'lodash'

/**
 * Older API token test cases can be found in `graph.spec.js`
 */
describe('API Tokens', () => {
  const user1: BasicTestUser = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    await createTestUsers([user1])

    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: user1.id,
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
        userId: user1.id,
        name: 'testapp',
        scopes: AllScopes
      })
      testApp1Token = appToken

      apollo = await testApolloServer({
        context: createTestContext({
          auth: true,
          userId: user1.id,
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

    it('can create app token with limited resource rules', async () => {
      const { data, errors } = await apollo.execute(AppTokenCreateDocument, {
        token: {
          name: 'test2',
          scopes: [Scopes.Profile.Read],
          limitResources: [{ id: 'abcde', type: TokenResourceIdentifierType.Project }]
        }
      })

      expect(data?.appTokenCreate).to.be.ok
      expect(errors).to.not.be.ok
    })

    describe('with limited resource access', () => {
      const user2: BasicTestUser = {
        name: 'Some other guy',
        email: 'bababooey@gmail.com',
        password: 'sn3aky-1337-b1m',
        id: ''
      }

      const stream1: BasicTestStream = {
        name: 'user1 stream 1',
        isPublic: true,
        ownerId: user1.id,
        id: ''
      }
      const stream2: BasicTestStream = {
        name: 'user1 stream 2',
        isPublic: false,
        ownerId: user1.id,
        id: ''
      }
      const stream3: BasicTestStream = {
        name: 'user2 stream 1',
        isPublic: true,
        ownerId: user2.id,
        id: ''
      }
      const stream4: BasicTestStream = {
        name: 'user2 stream 2',
        isPublic: true,
        ownerId: user2.id,
        id: ''
      }

      let limitedToken1: string

      before(async () => {
        await createTestUsers([user2])
        await createTestStreams([
          [stream1, user1],
          [stream2, user1],
          [stream3, user2],
          [stream4, user2]
        ])

        // Create token
        const limitResources = [
          { id: stream1.id, type: TokenResourceIdentifierType.Project },
          { id: stream3.id, type: TokenResourceIdentifierType.Project }
        ]
        const { data } = await apollo.execute(AppTokenCreateDocument, {
          token: {
            name: 'test2',
            scopes: [Scopes.Profile.Read],
            limitResources
          }
        })
        limitedToken1 = data?.appTokenCreate || ''
        if (!limitedToken1.length) {
          throw new Error("Couldn't prepare token for test")
        }

        apollo = await testApolloServer({
          context: createTestContext({
            auth: true,
            userId: user1.id,
            role: Roles.Server.Admin,
            scopes: AllScopes,
            token: limitedToken1,
            appId: testApp1Id,
            resourceAccessRules: limitResources
          })
        })
      })

      // TODO: 1. More queries 2. Check creation of new token with invalid rules (too relaxed)

      it('can only access allowed stream through stream()', async () => {
        const stream1Res = await apollo.execute(ReadStreamDocument, { id: stream1.id })
        const stream2Res = await apollo.execute(ReadStreamDocument, { id: stream2.id })
        const stream2NoRulesRes = await apollo.execute(
          ReadStreamDocument,
          { id: stream2.id },
          { context: { resourceAccessRules: null, token: 'somefaketoken' } }
        )

        expect(stream1Res.data?.stream?.id).to.be.ok
        expect(stream1Res.errors).to.not.be.ok

        expect(stream2Res.data?.stream).to.not.be.ok
        expect(
          (stream2Res.errors || []).find((e) =>
            e.message.includes('You do not have access to this resource')
          )
        ).to.be.ok

        expect(stream2NoRulesRes.data?.stream?.id).to.be.ok
        expect(stream2NoRulesRes.errors).to.not.be.ok
      })

      it('can only access allowed streams through streams()', async () => {
        const { data, errors } = await apollo.execute(ReadStreamsDocument, {})

        expect(errors).to.be.not.ok
        expect(data?.streams).to.be.ok
        expect(data?.streams?.totalCount).to.equal(1)
        expect(data?.streams?.items?.length).to.equal(1)
        expect(data?.streams?.items?.[0].id).to.equal(stream1.id)
      })

      it('can only access allowed streams through User.streams', async () => {
        const { data, errors } = await apollo.execute(GetUserStreamsDocument, {
          userId: user2.id
        })

        expect(errors).to.be.not.ok
        expect(data?.user?.streams).to.be.ok
        expect(data?.user?.streams?.totalCount).to.equal(1)
        expect(data?.user?.streams?.items?.length).to.equal(1)
        expect(data?.user?.streams?.items?.[0].id).to.equal(stream3.id)
      })
    })
  })
})
