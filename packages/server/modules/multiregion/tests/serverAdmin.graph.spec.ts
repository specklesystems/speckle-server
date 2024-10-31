import { MultiRegionConfig } from '@/modules/multiregion/domain/types'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { GetAvailableRegionKeysDocument } from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { MultiRegionConfigServiceMock } from '@/test/mocks/global'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Multi Region Server Settings', () => {
  let testAdminUser: BasicTestUser
  let apollo: TestApolloServer

  const fakeRegionConfig: MultiRegionConfig = {
    'us-west-1': {
      postgres: {
        connectionUri: 'postgres://user:password@uswest1:port/dbname'
      }
    },
    'eu-east-3': {
      postgres: {
        connectionUri: 'postgres://user:password@eueast3:port/dbname'
      }
    }
  }

  before(async () => {
    MultiRegionConfigServiceMock.mockFunction(
      'getAvailableRegionConfigsFactory',
      () => async () => fakeRegionConfig
    )

    await beforeEachContext()
    testAdminUser = await createTestUser({ role: Roles.Server.Admin })
    apollo = await testApolloServer({ authUserId: testAdminUser.id })
  })

  after(() => {
    MultiRegionConfigServiceMock.resetMockedFunction('getAvailableRegionConfigsFactory')
  })

  describe('server config', () => {
    it('allows retrieving available config keys', async () => {
      const { data } = await apollo.execute(GetAvailableRegionKeysDocument, {})
      expect(data?.serverInfo.multiRegion.availableKeys).to.deep.equal(
        Object.keys(fakeRegionConfig)
      )
    })
  })
})
