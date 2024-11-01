import { MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { Regions } from '@/modules/multiregion/repositories'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  CreateNewRegionDocument,
  CreateServerRegionInput,
  GetAvailableRegionKeysDocument,
  GetRegionsDocument
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { MultiRegionConfigServiceMock } from '@/test/mocks/global'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Multi Region Server Settings', () => {
  let testAdminUser: BasicTestUser
  let apollo: TestApolloServer

  const fakeRegionKey1 = 'us-west-1'
  const fakeRegionKey2 = 'eu-east-2'

  const fakeRegionConfig: MultiRegionConfig = {
    [fakeRegionKey1]: {
      postgres: {
        connectionUri: 'postgres://user:password@uswest1:port/dbname'
      }
    },
    [fakeRegionKey2]: {
      postgres: {
        connectionUri: 'postgres://user:password@eueast3:port/dbname'
      }
    }
  }

  before(async () => {
    // Have to mock both
    MultiRegionConfigServiceMock.mockFunction(
      'getAvailableRegionConfigsFactory',
      () => async () => fakeRegionConfig
    )
    MultiRegionConfigServiceMock.mockFunction(
      'getAvailableRegionKeysFactory',
      () => async () => Object.keys(fakeRegionConfig)
    )

    await beforeEachContext()
    testAdminUser = await createTestUser({ role: Roles.Server.Admin })
    apollo = await testApolloServer({ authUserId: testAdminUser.id })
  })

  after(() => {
    MultiRegionConfigServiceMock.resetMockedFunctions()
  })

  describe('server config', () => {
    const createRegion = (input: CreateServerRegionInput) =>
      apollo.execute(CreateNewRegionDocument, { input })

    it('allows retrieving available config keys', async () => {
      const res = await apollo.execute(GetAvailableRegionKeysDocument, {})
      expect(res.data?.serverInfo.multiRegion.availableKeys).to.deep.equal(
        Object.keys(fakeRegionConfig)
      )
      expect(res).to.not.haveGraphQLErrors()
    })

    describe('when creating new region', async () => {
      afterEach(async () => {
        // Wipe created regions
        await truncateTables([Regions.name])
      })

      it('it works with valid input', async () => {
        const input: CreateServerRegionInput = {
          key: fakeRegionKey1,
          name: 'US West 1',
          description: 'Helloooo'
        }

        const res = await createRegion(input)
        expect(res.data?.serverInfoMutations.multiRegion.create).to.deep.equal({
          ...input,
          id: input.key
        })
        expect(res).to.not.haveGraphQLErrors()
      })

      it("doesn't work with already used up key", async () => {
        const input: CreateServerRegionInput = {
          key: fakeRegionKey1,
          name: 'US West 1',
          description: 'Helloooo'
        }

        const res1 = await createRegion(input)
        expect(res1).to.not.haveGraphQLErrors()

        const res2 = await createRegion(input)
        expect(res2).to.haveGraphQLErrors('Region with this key already exists')
      })

      it("doesn't work with invalid key", async () => {
        const input: CreateServerRegionInput = {
          key: 'randooo-key',
          name: 'US West 1',
          description: 'Helloooo'
        }

        const res = await createRegion(input)
        expect(res).to.haveGraphQLErrors('Region key is not valid')
      })
    })

    describe('when working with existing regions', async () => {
      const createdRegionInput: CreateServerRegionInput = {
        key: fakeRegionKey1,
        name: 'US West 1',
        description: 'Helloooo'
      }

      before(async () => {
        // Create a region
        await createRegion(createdRegionInput)
      })

      it('allows retrieving all regions', async () => {
        const res = await apollo.execute(GetRegionsDocument, {})

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.serverInfo.multiRegion.regions).to.have.length(1)
        expect(res.data?.serverInfo.multiRegion.regions).to.deep.equal([
          {
            ...createdRegionInput,
            id: createdRegionInput.key
          }
        ])
      })

      it('filters out used region from available keys', async () => {
        const res = await apollo.execute(GetAvailableRegionKeysDocument, {})

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.serverInfo.multiRegion.availableKeys).to.deep.equal([
          fakeRegionKey2
        ])
      })
    })
  })
})
